// 自律打卡小程序
App({
  onLaunch() {
    // 检查是否首次使用
    const settings = wx.getStorageSync('settings')
    if (!settings) {
      // 首次使用，跳转到个人页选择性别
      this.globalData.isFirstLaunch = true
    } else {
      this.globalData.settings = settings
    }
  },

  globalData: {
    isFirstLaunch: false,
    settings: null
  }
})
