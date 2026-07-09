// 统计页
const storage = require('../../utils/storage')
const { defaultConfig, getToday } = require('../../utils/constants')

Page({
  data: {
    abstinenceLabel: '戒色',
    currentStreak: 0,
    longestStreak: 0,
    totalResets: 0,
    monthFitDays: 0,
    monthFitMinutes: 0,
    customStats: [],
    chartData: []
  },

  onShow() {
    const settings = storage.getSettings()
    if (!settings) return

    const gender = settings.gender
    const config = defaultConfig[gender] || defaultConfig.male
    const abstinence = storage.getAbstinence()
    const currentStreak = storage.getAbstinenceDays()

    // 本月统计
    const today = getToday()
    const monthStr = today.substring(0, 7) // '2026-07'
    const monthStats = storage.getMonthStats(monthStr)

    // 自定义模块完成率
    const daysInMonth = new Date(parseInt(today.substring(0, 4)), parseInt(today.substring(5, 7)), 0).getDate()
    const dayOfMonth = parseInt(today.substring(8, 10))
    const daysPassed = Math.min(dayOfMonth, daysInMonth)
    const customStats = monthStats.customStats.map(s => ({
      ...s,
      percent: daysPassed > 0 ? Math.round((s.count / daysPassed) * 100) : 0
    }))

    // 图表数据
    const history = storage.getAbstinenceHistory()
    const chartData = history.slice(-14) // 最近14条

    this.setData({
      abstinenceLabel: config.abstinenceLabel,
      currentStreak,
      longestStreak: abstinence.longestStreak,
      totalResets: abstinence.resetHistory.length,
      monthFitDays: monthStats.fitDays,
      monthFitMinutes: monthStats.fitMinutes,
      customStats,
      chartData
    })

    // 绘制图表
    if (chartData.length > 0) {
      this.drawChart(chartData)
    }
  },

  drawChart(data) {
    const query = wx.createSelectorQuery()
    query.select('#abstinenceChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getWindowInfo().pixelRatio

        const width = res[0].width
        const height = res[0].height

        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        // 清除画布
        ctx.clearRect(0, 0, width, height)

        if (data.length < 2) return

        // 计算边界
        const maxDays = Math.max(...data.map(d => d.days), 5)
        const padding = { top: 24, right: 24, bottom: 48, left: 48 }
        const chartW = width - padding.left - padding.right
        const chartH = height - padding.top - padding.bottom

        // 画网格线
        ctx.strokeStyle = '#f0f0f0'
        ctx.lineWidth = 1
        const gridLines = 5
        for (let i = 0; i <= gridLines; i++) {
          const y = padding.top + (chartH / gridLines) * i
          ctx.beginPath()
          ctx.moveTo(padding.left, y)
          ctx.lineTo(width - padding.right, y)
          ctx.stroke()

          // Y轴标签
          const val = Math.round(maxDays - (maxDays / gridLines) * i)
          ctx.fillStyle = '#999'
          ctx.font = '20rpx sans-serif'  // WeChat uses rpx, but canvas uses px
          // We'll use a simplified approach
        }

        // 画折线
        const stepX = chartW / (data.length - 1)

        // 渐变填充
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)')
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.02)')

        // 填充区域
        ctx.beginPath()
        ctx.moveTo(padding.left, height - padding.bottom)
        data.forEach((d, i) => {
          const x = padding.left + stepX * i
          const y = padding.top + chartH - (d.days / maxDays) * chartH
          ctx.lineTo(x, y)
        })
        ctx.lineTo(padding.left + stepX * (data.length - 1), height - padding.bottom)
        ctx.closePath()
        ctx.fillStyle = gradient
        ctx.fill()

        // 折线
        ctx.beginPath()
        ctx.strokeStyle = '#667eea'
        ctx.lineWidth = 3
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        data.forEach((d, i) => {
          const x = padding.left + stepX * i
          const y = padding.top + chartH - (d.days / maxDays) * chartH
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()

        // 数据点
        data.forEach((d, i) => {
          const x = padding.left + stepX * i
          const y = padding.top + chartH - (d.days / maxDays) * chartH

          // 当前点在最后才高亮
          if (i === data.length - 1) {
            ctx.beginPath()
            ctx.arc(x, y, 8, 0, Math.PI * 2)
            ctx.fillStyle = '#667eea'
            ctx.fill()
            ctx.beginPath()
            ctx.arc(x, y, 12, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(102, 126, 234, 0.2)'
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.arc(x, y, 5, 0, Math.PI * 2)
            ctx.fillStyle = '#667eea'
            ctx.fill()
          }
        })

        // 底部日期标签
        ctx.fillStyle = '#999'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        data.forEach((d, i) => {
          if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
            const x = padding.left + stepX * i
            const dateStr = d.date.substring(5) // '07-10'
            ctx.fillText(dateStr, x, height - 8)
          }
        })

        // Y轴标签
        ctx.fillStyle = '#999'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'right'
        for (let i = 0; i <= gridLines; i++) {
          const y = padding.top + (chartH / gridLines) * i
          const val = Math.round(maxDays - (maxDays / gridLines) * i)
          ctx.fillText(val + '', padding.left - 8, y + 4)
        }
      })
  }
})
