// 首页
const storage = require('../../utils/storage')
const {
  getEncouragement, getToday, formatDate, getWeekday,
  defaultConfig, quotes, checkinPraises, breakWarnings, randomPick
} = require('../../utils/constants')

Page({
  data: {
    isFirstLaunch: true,
    abstinenceDays: 0,
    abstinenceLabel: '',
    startDateText: '',
    longestStreak: 0,
    vitality: 0,
    breakVitality: 0,
    abstinenceChecked: false,
    modules: [],
    encouragement: '',
    todayText: '',
    showBreak: false,
    themeColor: '#4A90D9',
    themeLight: '#E8F2FC',
    // 名言轮播
    quotes: quotes,
    quoteText: '',
    quoteAuthor: '',
    currentQuote: 0,
    _cursor: 0,
    quoteFade: false,
    _quoteTimer: null
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

  onHide() {
    this.stopQuoteRotation()
  },

  // ===== 数据加载 =====
  loadData(settings) {
    const gender = settings.gender
    const config = defaultConfig[gender] || defaultConfig.male
    const abstinenceDays = storage.getAbstinenceDays()
    const vitality = storage.getVitality()
    const abstinence = storage.getAbstinence()
    let abstinenceChecked = storage.isAbstinenceCheckedInToday()
    const modules = storage.getAllModules()

    // 自动打卡：开启后每天首次打开自动确认
    if (settings.autoCheckin && !abstinenceChecked) {
      storage.doAbstinenceCheckin()
      abstinenceChecked = true
    }

    const todayModules = modules.map(m => ({
      ...m,
      checked: storage.isCheckedInToday(m.id)
    }))

    this.setData({
      abstinenceDays,
      vitality,
      breakVitality: Math.round(vitality * 0.6),
      abstinenceLabel: config.abstinenceLabel,
      startDateText: formatDate(abstinence.startDate),
      longestStreak: abstinence.longestStreak,
      abstinenceChecked,
      modules: todayModules,
      encouragement: getEncouragement(abstinenceDays),
      todayText: getToday() + ' ' + getWeekday(),
      themeColor: config.themeColor,
      themeLight: config.themeLight
    })

    // 动态设置导航栏颜色
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: config.themeColor
    })

    // 同步 TabBar 颜色
    wx.setTabBarStyle({
      selectedColor: config.themeColor
    })
  },

  // ===== 戒色打卡 =====
  doCheckinAbstinence() {
    if (this.data.abstinenceChecked) {
      wx.showToast({ title: '今天已打卡，明天继续加油！✨', icon: 'none', duration: 2000 })
      return
    }

    const ok = storage.doAbstinenceCheckin()
    if (!ok) return

    const praise = randomPick(checkinPraises)
    this.loadData(storage.getSettings())

    wx.showToast({ title: praise, icon: 'none', duration: 2500 })
    wx.vibrateShort({ type: 'medium' })
  },

  // ===== 破戒 =====
  showBreakModal() {
    const vitality = storage.getVitality()
    this.setData({
      showBreak: true,
      vitality,
      breakVitality: Math.round(vitality * 0.6)
    })
  },

  hideBreakModal() {
    this.setData({ showBreak: false })
  },

  doBreak() {
    const result = storage.breakAbstinence()
    this.setData({ showBreak: false })
    this.loadData(storage.getSettings())

    const warning = randomPick(breakWarnings)
    wx.showModal({
      title: '已记录',
      content: warning + '\n\n元气值 ' + result.oldVitality + '% → ' + Math.round(result.oldVitality * 0.6) + '%',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#4A90D9'
    })
  },

  // ===== 名言轮播 =====
  startQuoteRotation() {
    this.stopQuoteRotation()
    this.updateQuote()
    const timer = setInterval(() => {
      this.updateQuote()
    }, 5000)
    this.setData({ _quoteTimer: timer })
  },

  stopQuoteRotation() {
    const timer = this.data._quoteTimer
    if (timer) {
      clearInterval(timer)
      this.setData({ _quoteTimer: null })
    }
  },

  updateQuote() {
    const cursor = this.data._cursor
    const q = quotes[cursor]
    this.setData({
      quoteText: q.text,
      quoteAuthor: q.author,
      currentQuote: cursor,
      _cursor: (cursor + 1) % quotes.length,
      quoteFade: false
    })
    setTimeout(() => {
      this.setData({ quoteFade: true })
    }, 50)
  },

  // ===== 模块打卡 =====
  toggleCheckin(e) {
    const { id, checked } = e.currentTarget.dataset

    if (checked) {
      wx.showModal({
        title: '取消打卡',
        content: '确定要取消今天的打卡吗？',
        success: (res) => {
          if (res.confirm) {
            storage.undoCheckin(id)
            this.loadData(storage.getSettings())
            wx.showToast({ title: '已取消', icon: 'none' })
          }
        }
      })
    } else {
      if (id === 'fitness') {
        this.fitnessCheckin()
        return
      }

      storage.doCheckin(id)
      this.loadData(storage.getSettings())
      wx.showToast({ title: '打卡成功 ✅', icon: 'none' })
      wx.vibrateShort({ type: 'light' })
    }
  },

  fitnessCheckin() {
    wx.showActionSheet({
      itemList: ['快速打卡（不记录详情）', '记录运动详情'],
      success: (res) => {
        if (res.tapIndex === 0) {
          storage.doCheckin('fitness')
          this.loadData(storage.getSettings())
          wx.showToast({ title: '健身打卡 ✅', icon: 'none' })
          wx.vibrateShort({ type: 'light' })
        } else {
          wx.switchTab({ url: '/pages/checkin/checkin' })
        }
      }
    })
  },

  goToProfile() {
    wx.switchTab({ url: '/pages/profile/profile' })
  }
})
