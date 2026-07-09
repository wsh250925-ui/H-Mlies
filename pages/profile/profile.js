// 个人页
const storage = require('../../utils/storage')
const { moduleIcons, defaultConfig, getToday } = require('../../utils/constants')

Page({
  data: {
    settings: { gender: '' },
    genderSaved: false,
    customModules: [],
    defaultModules: [
      { id: 'abstinence', name: '戒色', icon: '🛡️' },
      { id: 'fitness', name: '健身', icon: '💪' }
    ],

    // 添加模块弹窗
    showAdd: false,
    newModuleName: '',
    newModuleIcon: '📌',
    moduleIcons: moduleIcons
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const settings = storage.getSettings()
    const customModules = storage.getCustomModules()

    // 更新默认模块名称（根据性别）
    const defaultModules = [
      { id: 'abstinence', name: settings ? (defaultConfig[settings.gender]?.abstinenceLabel || '戒色') : '戒色', icon: '🛡️' },
      { id: 'fitness', name: '健身', icon: '💪' }
    ]

    this.setData({
      settings: settings || { gender: '' },
      genderSaved: !!settings,
      customModules,
      defaultModules
    })
  },

  // 选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    const config = defaultConfig[gender]

    const settings = {
      gender,
      abstinenceLabel: config.abstinenceLabel,
      themeColor: config.themeColor,
      themeLight: config.themeLight,
      createdAt: getToday()
    }

    storage.saveSettings(settings)

    // 初始化戒色数据（如果还没初始化）
    const abstinence = storage.getAbstinence()
    if (!abstinence.startDate) {
      storage.saveAbstinence({
        startDate: getToday(),
        longestStreak: 0,
        resetHistory: []
      })
    }

    this.loadData()

    // 更新 TabBar 颜色
    wx.setTabBarStyle({
      selectedColor: config.themeColor
    })

    wx.showToast({ title: '设置成功！', icon: 'success' })

    // 跳转回首页
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' })
    }, 800)
  },

  // ==== 自定义模块 ====
  showAddModule() {
    this.setData({
      showAdd: true,
      newModuleName: '',
      newModuleIcon: '📌'
    })
  },

  hideAddModule() {
    this.setData({ showAdd: false })
  },

  onNameInput(e) {
    this.setData({ newModuleName: e.detail.value })
  },

  selectIcon(e) {
    this.setData({ newModuleIcon: e.currentTarget.dataset.icon })
  },

  saveModule() {
    const name = this.data.newModuleName.trim()
    if (!name) {
      wx.showToast({ title: '请输入模块名称', icon: 'none' })
      return
    }

    storage.addCustomModule({
      name,
      icon: this.data.newModuleIcon
    })

    this.setData({ showAdd: false })
    this.loadData()
    wx.showToast({ title: '添加成功！', icon: 'success' })
  },

  // 删除模块
  deleteModule(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除模块',
      content: '确定要删除这个模块吗？已打卡的记录不会被删除。',
      success: (res) => {
        if (res.confirm) {
          storage.deleteCustomModule(id)
          this.loadData()
          wx.showToast({ title: '已删除', icon: 'none' })
        }
      }
    })
  },

  // ==== 数据管理 ====
  exportData() {
    const data = {
      settings: storage.getSettings(),
      abstinence: storage.getAbstinence(),
      checkins: storage.getCheckins(),
      customModules: storage.getCustomModules(),
      fitnessLogs: storage.getFitnessLogs(),
      exportTime: new Date().toISOString()
    }

    // 复制到剪贴板
    wx.setClipboardData({
      data: JSON.stringify(data, null, 2),
      success: () => {
        wx.showModal({
          title: '导出成功',
          content: '数据已复制到剪贴板，请粘贴到安全的地方保存。',
          showCancel: false
        })
      }
    })
  },

  clearData() {
    wx.showModal({
      title: '⚠️ 危险操作',
      content: '确定要清除所有数据吗？此操作不可恢复！建议先导出数据备份。',
      confirmText: '确认清除',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          this.setData({
            settings: { gender: '' },
            genderSaved: false,
            customModules: []
          })
          wx.showToast({ title: '已清除所有数据', icon: 'none' })
        }
      }
    })
  }
})
