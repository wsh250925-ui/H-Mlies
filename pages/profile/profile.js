// 个人页
const storage = require('../../utils/storage')
const { moduleIcons, defaultConfig, getToday } = require('../../utils/constants')

Page({
  data: {
    settings: { gender: '' },
    genderSaved: false,
    trackers: [],
    showAdd: false,
    newModuleName: '',
    newModuleIcon: '📌',
    moduleIcons
  },

  onShow() { this.loadData() },

  loadData() {
    const settings = storage.getSettings()
    const trackers = storage.getTrackers()
    this.setData({
      settings: settings || { gender: '' },
      genderSaved: !!settings,
      trackers
    })
  },

  // 选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    const config = defaultConfig[gender]
    const old = storage.getSettings()
    storage.saveSettings({
      gender,
      abstinenceLabel: config.abstinenceLabel,
      themeColor: config.themeColor,
      themeLight: config.themeLight,
      autoCheckin: old ? old.autoCheckin : false,
      createdAt: getToday()
    })

    // 更新戒色追踪器名称
    const trackers = storage.getTrackers()
    if (trackers[0] && trackers[0].id === 'abstinence') {
      trackers[0].name = config.abstinenceLabel
      storage.saveTrackers(trackers)
    }

    this.loadData()
    wx.setTabBarStyle({ selectedColor: config.themeColor })
    wx.showToast({ title: '设置成功！', icon: 'success' })
    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 800)
  },

  // 自动打卡
  toggleAutoCheckin(e) {
    const settings = storage.getSettings()
    if (!settings) return
    settings.autoCheckin = e.detail.value
    storage.saveSettings(settings)
    this.loadData()
    wx.showToast({ title: settings.autoCheckin ? '已开启自动打卡' : '已关闭自动打卡', icon: 'none' })
  },

  // 添加模块
  showAddModule() { this.setData({ showAdd: true, newModuleName: '', newModuleIcon: '📌' }) },
  hideAddModule() { this.setData({ showAdd: false }) },
  onNameInput(e) { this.setData({ newModuleName: e.detail.value }) },
  selectIcon(e) { this.setData({ newModuleIcon: e.currentTarget.dataset.icon }) },

  saveModule() {
    const name = this.data.newModuleName.trim()
    if (!name) { wx.showToast({ title: '请输入名称', icon: 'none' }); return }
    storage.addTracker(name, this.data.newModuleIcon)
    this.setData({ showAdd: false })
    this.loadData()
    wx.showToast({ title: '添加成功！', icon: 'success' })
  },

  // 删除模块
  deleteTracker(e) {
    const id = e.currentTarget.dataset.id
    const t = this.data.trackers.find(tr => tr.id === id)
    wx.showModal({
      title: '删除「' + t.name + '」',
      content: '确定删除这个模块吗？所有记录将被清除。',
      success: (res) => {
        if (res.confirm) {
          storage.deleteTracker(id)
          this.loadData()
          wx.showToast({ title: '已删除', icon: 'none' })
        }
      }
    })
  },

  // 数据管理
  exportData() {
    const data = {
      settings: storage.getSettings(),
      trackers: storage.getTrackers(),
      fitnessLogs: storage.getFitnessLogs(),
      exportTime: new Date().toISOString()
    }
    wx.setClipboardData({
      data: JSON.stringify(data, null, 2),
      success: () => wx.showModal({ title: '导出成功', content: '数据已复制到剪贴板', showCancel: false })
    })
  },

  clearData() {
    wx.showModal({
      title: '⚠️ 危险操作',
      content: '确定清除所有数据吗？此操作不可恢复！建议先导出数据备份。',
      confirmText: '确认清除', confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          this.setData({ settings: { gender: '' }, genderSaved: false, trackers: [] })
          wx.showToast({ title: '已清除', icon: 'none' })
        }
      }
    })
  }
})
