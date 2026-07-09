// 打卡页 — 运动详情记录
const storage = require('../../utils/storage')
const { getToday, exerciseTypes } = require('../../utils/constants')

Page({
  data: {
    todayLogs: [],
    fitnessType: '力量训练',
    fitnessDuration: 30,
    exerciseTypes,
    monthDays: 0,
    monthMins: 0
  },

  onShow() {
    const logs = storage.getFitnessLogs()
    const today = getToday()
    const monthStr = today.substring(0, 7)
    const todayLogs = logs.filter(l => l.date === today)
    const monthLogs = logs.filter(l => l.date.startsWith(monthStr))
    const monthDays = new Set(monthLogs.map(l => l.date)).size
    const monthMins = monthLogs.reduce((s, l) => s + (l.duration || 0), 0)
    this.setData({ todayLogs, monthDays, monthMins })
  },

  selectType(e) { this.setData({ fitnessType: e.currentTarget.dataset.type }) },
  changeDur(e) {
    let d = this.data.fitnessDuration + parseInt(e.currentTarget.dataset.d)
    this.setData({ fitnessDuration: Math.max(5, Math.min(300, d)) })
  },
  setDur(e) { this.setData({ fitnessDuration: parseInt(e.currentTarget.dataset.d) }) },

  saveLog() {
    storage.doTrackerCheckin('fitness')
    storage.addFitnessLog({ type: this.data.fitnessType, duration: this.data.fitnessDuration })
    this.onShow()
    wx.showToast({ title: '记录成功！💪', icon: 'none' })
    wx.vibrateShort({ type: 'light' })
  }
})
