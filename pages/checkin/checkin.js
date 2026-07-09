// 打卡页
const storage = require('../../utils/storage')
const { getToday, getWeekday, exerciseTypes } = require('../../utils/constants')

Page({
  data: {
    modules: [],
    todayText: '',
    showFitness: false,
    fitnessType: '力量训练',
    fitnessDuration: 30,
    exerciseTypes: exerciseTypes
  },

  onShow() {
    const settings = storage.getSettings()
    if (!settings) return

    const modules = storage.getAllModules().map(m => ({
      ...m,
      checked: storage.isCheckedInToday(m.id)
    }))

    this.setData({
      modules,
      todayText: getToday() + ' ' + getWeekday()
    })
  },

  // 快速打卡
  doCheckin(e) {
    const id = e.currentTarget.dataset.id
    storage.doCheckin(id)
    this.refreshModules()
    wx.showToast({ title: '打卡成功 ✅', icon: 'none' })
    wx.vibrateShort({ type: 'light' })
  },

  // 快速健身打卡
  quickCheckin(e) {
    const id = e.currentTarget.dataset.id
    storage.doCheckin(id)
    this.refreshModules()
    wx.showToast({ title: '健身打卡 ✅', icon: 'none' })
    wx.vibrateShort({ type: 'light' })
  },

  // 取消打卡
  undoCheckin(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消打卡',
      content: '确定要取消吗？',
      success: (res) => {
        if (res.confirm) {
          storage.undoCheckin(id)
          this.refreshModules()
          wx.showToast({ title: '已取消', icon: 'none' })
        }
      }
    })
  },

  // 刷新模块状态
  refreshModules() {
    const modules = storage.getAllModules().map(m => ({
      ...m,
      checked: storage.isCheckedInToday(m.id)
    }))
    this.setData({ modules })
  },

  // ==== 健身详情弹窗 ====
  showFitnessDetail() {
    this.setData({ showFitness: true })
  },

  hideFitnessDetail() {
    this.setData({ showFitness: false })
  },

  selectType(e) {
    this.setData({ fitnessType: e.currentTarget.dataset.type })
  },

  changeDuration(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    let d = this.data.fitnessDuration + delta
    if (d < 5) d = 5
    if (d > 300) d = 300
    this.setData({ fitnessDuration: d })
  },

  setDuration(e) {
    const d = parseInt(e.currentTarget.dataset.d)
    this.setData({ fitnessDuration: d })
  },

  saveFitnessLog() {
    // 打卡健身
    storage.doCheckin('fitness')
    // 保存详细记录
    storage.addFitnessLog({
      type: this.data.fitnessType,
      duration: this.data.fitnessDuration
    })
    this.setData({ showFitness: false })
    this.refreshModules()
    wx.showToast({ title: '记录成功！💪', icon: 'none' })
    wx.vibrateShort({ type: 'light' })
  }
})
