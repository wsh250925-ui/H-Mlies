// 首页
const storage = require('../../utils/storage')
const { getEncouragement, getToday, formatDate, getWeekday, defaultConfig } = require('../../utils/constants')

Page({
  data: {
    isFirstLaunch: true,
    abstinenceDays: 0,
    abstinenceLabel: '',
    startDateText: '',
    longestStreak: 0,
    modules: [],
    encouragement: '',
    todayText: '',
    showReset: false,
    themeColor: '#4A90D9',
    themeLight: '#E8F2FC'
  },

  onShow() {
    const app = getApp()
    const settings = storage.getSettings()

    if (!settings) {
      this.setData({ isFirstLaunch: true })
      return
    }

    this.setData({ isFirstLaunch: false })
    this.loadData(settings)
  },

  loadData(settings) {
    const gender = settings.gender
    const config = defaultConfig[gender] || defaultConfig.male
    const abstinenceDays = storage.getAbstinenceDays()
    const abstinence = storage.getAbstinence()
    const modules = storage.getAllModules()

    // 加上戒色模块（虚拟模块，不在打卡列表里，但有计数器）
    // 构建今日状态列表
    const todayModules = modules.map(m => ({
      ...m,
      checked: storage.isCheckedInToday(m.id)
    }))

    this.setData({
      abstinenceDays,
      abstinenceLabel: config.abstinenceLabel,
      startDateText: formatDate(abstinence.startDate),
      longestStreak: abstinence.longestStreak,
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

  // 切换打卡状态
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
      // 健身模块用特殊打卡流程
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

  // 健身打卡（弹出运动类型选择）
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
          // 跳转到打卡页的健身详情
          wx.switchTab({ url: '/pages/checkin/checkin' })
        }
      }
    })
  },

  // 重置弹窗
  showResetModal() {
    this.setData({ showReset: true })
  },

  hideResetModal() {
    this.setData({ showReset: false })
  },

  doReset() {
    storage.resetAbstinence()
    this.setData({ showReset: false })
    this.loadData(storage.getSettings())
    wx.showToast({ title: '已重置，重新开始！', icon: 'none' })
  },

  // 跳转
  goToProfile() {
    wx.switchTab({ url: '/pages/profile/profile' })
  }
})
