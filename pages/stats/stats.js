// 统计页
const storage = require('../../utils/storage')
const { defaultConfig, getToday, calcVitality } = require('../../utils/constants')

Page({
  data: {
    abstinenceLabel: '戒色',
    abstinenceDays: 0,
    abstinenceVitality: 0,
    longestStreak: 0,
    totalBreaks: 0,
    monthFitDays: 0,
    monthFitMinutes: 0,
    trackers: [],
    chartData: []
  },

  onShow() {
    const settings = storage.getSettings()
    if (!settings) return

    const gender = settings.gender
    const config = defaultConfig[gender] || defaultConfig.male
    const trackers = storage.getTrackers()

    // 戒色追踪器
    const abs = trackers.find(t => t.id === 'abstinence')
    const abstinenceDays = abs ? storage.getTrackerDays('abstinence') : 0
    const abstinenceVitality = abs ? storage.getTrackerVitality('abstinence') : 0

    // 本月统计
    const monthStr = getToday().substring(0, 7)
    const monthStats = storage.getMonthStats(monthStr)

    // 其他追踪器统计
    const trackerStats = trackers.filter(t => t.id !== 'abstinence').map(t => ({
      name: t.name,
      icon: t.icon,
      vitality: storage.getTrackerVitality(t.id),
      days: storage.getTrackerDays(t.id),
      longestStreak: t.longestStreak
    }))

    // 图表数据
    const history = storage.getTrackerHistory('abstinence')
    const chartData = history.slice(-14)

    this.setData({
      abstinenceLabel: config.abstinenceLabel,
      abstinenceDays,
      abstinenceVitality,
      longestStreak: abs ? abs.longestStreak : 0,
      totalBreaks: abs ? abs.breakHistory.length : 0,
      monthFitDays: monthStats.fitDays,
      monthFitMinutes: monthStats.fitMinutes,
      trackers: trackerStats,
      chartData
    })

    if (chartData.length > 0) this.drawChart(chartData)
  },

  drawChart(data) {
    const query = wx.createSelectorQuery()
    query.select('#abstinenceChart').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getWindowInfo().pixelRatio
      const width = res[0].width, height = res[0].height
      canvas.width = width * dpr; canvas.height = height * dpr
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)
      if (data.length < 2) return

      const maxDays = Math.max(...data.map(d => d.days), 5)
      const pad = { top: 24, right: 24, bottom: 48, left: 48 }
      const cw = width - pad.left - pad.right, ch = height - pad.top - pad.bottom
      const stepX = cw / (data.length - 1)
      const gridLines = 5

      // 网格
      ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1
      for (let i = 0; i <= gridLines; i++) {
        const y = pad.top + (ch / gridLines) * i
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke()
      }

      // 渐变填充
      const gradient = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom)
      gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)')
      gradient.addColorStop(1, 'rgba(102, 126, 234, 0.02)')
      ctx.beginPath()
      ctx.moveTo(pad.left, height - pad.bottom)
      data.forEach((d, i) => {
        const x = pad.left + stepX * i
        const y = pad.top + ch - (d.days / maxDays) * ch
        ctx.lineTo(x, y)
      })
      ctx.lineTo(pad.left + stepX * (data.length - 1), height - pad.bottom)
      ctx.closePath(); ctx.fillStyle = gradient; ctx.fill()

      // 折线
      ctx.beginPath(); ctx.strokeStyle = '#667eea'; ctx.lineWidth = 3; ctx.lineJoin = 'round'
      data.forEach((d, i) => {
        const x = pad.left + stepX * i, y = pad.top + ch - (d.days / maxDays) * ch
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }); ctx.stroke()

      // 数据点
      data.forEach((d, i) => {
        const x = pad.left + stepX * i, y = pad.top + ch - (d.days / maxDays) * ch
        ctx.beginPath()
        ctx.arc(x, y, i === data.length - 1 ? 8 : 5, 0, Math.PI * 2)
        ctx.fillStyle = '#667eea'; ctx.fill()
        if (i === data.length - 1) {
          ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(102, 126, 234, 0.2)'; ctx.fill()
        }
      })

      // 底部标签
      ctx.fillStyle = '#999'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
      data.forEach((d, i) => {
        if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
          ctx.fillText(d.date.substring(5), pad.left + stepX * i, height - 8)
        }
      })

      // Y轴标签
      ctx.textAlign = 'right'; ctx.font = '10px sans-serif'
      for (let i = 0; i <= gridLines; i++) {
        const val = Math.round(maxDays - (maxDays / gridLines) * i)
        ctx.fillText(val + '', pad.left - 8, pad.top + (ch / gridLines) * i + 4)
      }
    })
  }
})
