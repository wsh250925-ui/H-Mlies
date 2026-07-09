// 本地存储工具
const { getToday } = require('./constants')

// ========== 设置 ==========
function getSettings() {
  return wx.getStorageSync('settings') || null
}

function saveSettings(settings) {
  wx.setStorageSync('settings', settings)
}

// ========== 戒色数据 ==========
function getAbstinence() {
  const data = wx.getStorageSync('abstinence')
  if (!data) {
    return {
      startDate: getToday(),
      longestStreak: 0,
      resetHistory: []
    }
  }
  return data
}

function saveAbstinence(data) {
  wx.setStorageSync('abstinence', data)
}

// 计算当前连续天数
function getAbstinenceDays() {
  const data = getAbstinence()
  if (!data.startDate) return 0
  const start = new Date(data.startDate)
  const today = new Date(getToday())
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

// 重置戒色计数器
function resetAbstinence() {
  const data = getAbstinence()
  const days = getAbstinenceDays()

  // 记录本次
  data.resetHistory.push({
    date: getToday(),
    days: days
  })

  // 更新最长记录
  if (days > data.longestStreak) {
    data.longestStreak = days
  }

  // 重置开始日期
  data.startDate = getToday()
  saveAbstinence(data)
  return data
}

// ========== 每日打卡 ==========
function getCheckins() {
  return wx.getStorageSync('checkins') || {}
}

function saveCheckins(checkins) {
  wx.setStorageSync('checkins', checkins)
}

// 今日某个模块是否已打卡
function isCheckedInToday(moduleId) {
  const checkins = getCheckins()
  const today = getToday()
  return !!(checkins[today] && checkins[today][moduleId])
}

// 打卡
function doCheckin(moduleId) {
  const checkins = getCheckins()
  const today = getToday()
  if (!checkins[today]) checkins[today] = {}
  checkins[today][moduleId] = true
  saveCheckins(checkins)
}

// 取消打卡
function undoCheckin(moduleId) {
  const checkins = getCheckins()
  const today = getToday()
  if (checkins[today]) {
    delete checkins[today][moduleId]
  }
  saveCheckins(checkins)
}

// ========== 自定义模块 ==========
function getCustomModules() {
  return wx.getStorageSync('customModules') || []
}

function saveCustomModules(modules) {
  wx.setStorageSync('customModules', modules)
}

function addCustomModule(module) {
  const modules = getCustomModules()
  modules.push({
    id: 'custom_' + Date.now(),
    name: module.name,
    icon: module.icon || '📌',
    createdAt: getToday()
  })
  saveCustomModules(modules)
  return modules
}

function deleteCustomModule(id) {
  let modules = getCustomModules()
  modules = modules.filter(m => m.id !== id)
  saveCustomModules(modules)
  return modules
}

// 获取所有打卡模块（默认 + 自定义）
function getAllModules() {
  const settings = getSettings()
  const customs = getCustomModules()

  const defaults = [
    { id: 'fitness', name: '健身', icon: '💪', isDefault: true, deletable: false }
  ]

  return [...defaults, ...customs.map(m => ({ ...m, isDefault: false, deletable: true }))]
}

// ========== 健身记录 ==========
function getFitnessLogs() {
  return wx.getStorageSync('fitnessLogs') || []
}

function saveFitnessLogs(logs) {
  wx.setStorageSync('fitnessLogs', logs)
}

function addFitnessLog(log) {
  const logs = getFitnessLogs()
  logs.push({
    date: getToday(),
    type: log.type || '运动',
    duration: log.duration || 0
  })
  saveFitnessLogs(logs)
  return logs
}

// ========== 数据统计 ==========
function getMonthStats(monthStr) {
  // monthStr: '2026-07'
  const checkins = getCheckins()
  const logs = getFitnessLogs()

  let fitDays = 0
  let customStats = {} // { moduleId: count }
  const modules = getCustomModules()

  modules.forEach(m => { customStats[m.id] = { name: m.name, count: 0 } })

  Object.keys(checkins).forEach(date => {
    if (date.startsWith(monthStr)) {
      const day = checkins[date]
      if (day.fitness) fitDays++
      modules.forEach(m => {
        if (day[m.id]) customStats[m.id].count++
      })
    }
  })

  // 健身总时长
  let fitMinutes = 0
  logs.forEach(log => {
    if (log.date.startsWith(monthStr)) {
      fitMinutes += (log.duration || 0)
    }
  })

  return {
    fitDays,
    fitMinutes,
    customStats: Object.values(customStats)
  }
}

// 获取戒色重置历史（最近10条）
function getAbstinenceHistory() {
  const data = getAbstinence()
  const history = [...data.resetHistory]
  // 加上当前进行中的
  const currentDays = getAbstinenceDays()
  if (currentDays > 0) {
    history.push({ date: getToday(), days: currentDays, current: true })
  }
  return history.slice(-30) // 最近30条记录
}

module.exports = {
  getSettings,
  saveSettings,
  getAbstinence,
  saveAbstinence,
  getAbstinenceDays,
  resetAbstinence,
  getCheckins,
  saveCheckins,
  isCheckedInToday,
  doCheckin,
  undoCheckin,
  getCustomModules,
  saveCustomModules,
  addCustomModule,
  deleteCustomModule,
  getAllModules,
  getFitnessLogs,
  saveFitnessLogs,
  addFitnessLog,
  getMonthStats,
  getAbstinenceHistory
}
