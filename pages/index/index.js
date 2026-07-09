// 首页
const storage = require('../../utils/storage')
const {
  getEncouragement, getToday, formatDate, getWeekday,
  defaultConfig, quotes, checkinPraises, breakWarnings, randomPick
} = require('../../utils/constants')

// 卡片配色轮换
const cardColors = [
  { color: '#4A90D9', colorLight: '#D6E8FB' },
  { color: '#52C41A', colorLight: '#D9F5D0' },
  { color: '#9B7ED8', colorLight: '#EAE2F7' },
  { color: '#FA8C16', colorLight: '#FFE8CC' },
  { color: '#36CFC9', colorLight: '#D4F8F6' },
  { color: '#F759AB', colorLight: '#FDE0EE' },
]

Page({
  data: {
    isFirstLaunch: true,
    trackers: [],
    encouragement: '',
    // 名言
    quotes, quoteText: '', quoteAuthor: '', currentQuote: 0, _cursor: 0, quoteFade: false, _quoteTimer: null,
    // 弹窗
    showBreak: false, breakTarget: {},
    // 主题
    themeColor: '#4A90D9', themeLight: '#E8F2FC'
  },

  onShow() {
    const settings = storage.getSettings()
    if (!settings) {
      this.setData({ isFirstLaunch: true })
      return
    }
    this.setData({ isFirstLaunch: false })
    this.loadData(settings)
    this.startQuoteRotation()
  },

  onHide() { this.stopQuoteRotation() },

  loadData(settings) {
    const gender = settings.gender
    const theme = defaultConfig[gender] || defaultConfig.male
    const rawTrackers = storage.getTrackers()

    // 构建追踪器显示数据
    const trackers = rawTrackers.map((t, i) => {
      const days = storage.getTrackerDays(t.id)
      const vitality = storage.getTrackerVitality(t.id)
      const checked = storage.isTrackerCheckedInToday(t.id)
      const palette = cardColors[i % cardColors.length]
      return {
        ...t,
        days,
        vitality,
        checked,
        startText: formatDate(t.startDate),
        color: palette.color,
        colorLight: palette.colorLight
      }
    })

    // 自动打卡
    if (settings.autoCheckin) {
      trackers.forEach(t => {
        if (!t.checked) {
          storage.doTrackerCheckin(t.id)
          t.checked = true
        }
      })
    }

    // 主鼓励语基于戒色追踪器
    const abstinence = trackers.find(t => t.id === 'abstinence')
    const totalDays = abstinence ? abstinence.days : 0

    this.setData({
      trackers,
      encouragement: getEncouragement(totalDays),
      themeColor: theme.themeColor,
      themeLight: theme.themeLight,
      todayText: getToday() + ' ' + getWeekday()
    })

    wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: theme.themeColor })
    wx.setTabBarStyle({ selectedColor: theme.themeColor })
  },

  // ===== 打卡 =====
  doCheckin(e) {
    const id = e.currentTarget.dataset.id
    const tracker = this.data.trackers.find(t => t.id === id)
    if (!tracker) return

    // 戒色用夸奖语，其他用通用
    if (tracker.checked) {
      wx.showToast({ title: '今天已打卡，明天继续！✨', icon: 'none', duration: 2000 })
      return
    }

    storage.doTrackerCheckin(id)

    const praise = tracker.type === 'abstinence'
      ? randomPick(checkinPraises)
      : `${tracker.name}打卡成功！坚持就是胜利 💪`

    this.refreshTrackers()
    wx.showToast({ title: praise, icon: 'none', duration: 2500 })
    wx.vibrateShort({ type: 'medium' })
  },

  // ===== 休息/破戒 =====
  showBreak(e) {
    const { id, name, vitality } = e.currentTarget.dataset
    this.setData({
      showBreak: true,
      breakTarget: {
        id, name,
        vitality: parseInt(vitality),
        after: Math.round(parseInt(vitality) * 0.6)
      }
    })
  },

  hideBreak() { this.setData({ showBreak: false }) },

  doBreak() {
    const id = this.data.breakTarget.id
    const result = storage.breakTracker(id)
    this.setData({ showBreak: false })
    this.refreshTrackers()

    // 戒色用身体提醒，其他通用
    const isAbstinence = id === 'abstinence'
    const msg = isAbstinence
      ? randomPick(breakWarnings)
      : '休息一下，重新出发！身体才是最重要的 💙'

    wx.showModal({
      title: '已记录',
      content: msg + '\n\n元气值 ' + result.oldVitality + '% → ' + Math.round(result.oldVitality * 0.6) + '%',
      showCancel: false, confirmText: '知道了', confirmColor: '#4A90D9'
    })
  },

  refreshTrackers() {
    const settings = storage.getSettings()
    if (settings) this.loadData(settings)
  },

  // ===== 名言 =====
  startQuoteRotation() {
    this.stopQuoteRotation()
    this.updateQuote()
    this.setData({ _quoteTimer: setInterval(() => this.updateQuote(), 5000) })
  },
  stopQuoteRotation() {
    if (this.data._quoteTimer) { clearInterval(this.data._quoteTimer); this.setData({ _quoteTimer: null }) }
  },
  updateQuote() {
    const c = this.data._cursor
    const q = quotes[c]
    this.setData({ quoteText: q.text, quoteAuthor: q.author, currentQuote: c, _cursor: (c + 1) % quotes.length, quoteFade: false })
    setTimeout(() => this.setData({ quoteFade: true }), 50)
  },

  goToProfile() { wx.switchTab({ url: '/pages/profile/profile' }) }
})
