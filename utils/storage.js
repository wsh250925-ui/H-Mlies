// 本地存储工具
const { getToday, calcVitality, VITALITY_CYCLE, defaultConfig } = require('./constants')

// ========== 设置 ==========
function getSettings() {
  return wx.getStorageSync('settings') || null
}

function saveSettings(settings) {
  wx.setStorageSync('settings', settings)
}

// ========== 统一追踪器系统 ==========
// 每个追踪器: { id, name, icon, type, deletable, startDate, longestStreak, breakHistory, todayChecked, checkedDate }

function getTrackers() {
  let trackers = wx.getStorageSync('trackers')
  if (!trackers || trackers.length === 0) {
    // 首次初始化：创建戒色 + 健身两个默认追踪器
    const settings = getSettings()
    const label = settings ? (defaultConfig[settings.gender]?.abstinenceLabel || '戒色') : '戒色'
    trackers = [
      { id: 'abstinence', name: label, icon: '🛡️', type: 'abstinence', deletable: false, startDate: getToday(), longestStreak: 0, breakHistory: [], todayChecked: false, checkedDate: '' },
      { id: 'fitness', name: '健身', icon: '💪', type: 'fitness', deletable: false, startDate: getToday(), longestStreak: 0, breakHistory: [], todayChecked: false, checkedDate: '' }
    ]
    saveTrackers(trackers)
  }
  // 同步戒色名称
  const settings = getSettings()
  if (settings && trackers[0]) {
    const label = defaultConfig[settings.gender]?.abstinenceLabel || '戒色'
    if (trackers[0].name !== label) {
      trackers[0].name = label
      saveTrackers(trackers)
    }
  }
  return trackers
}

function saveTrackers(trackers) {
  wx.setStorageSync('trackers', trackers)
}

function addTracker(name, icon) {
  const trackers = getTrackers()
  trackers.push({
    id: 'tracker_' + Date.now(),
    name, icon: icon || '📌',
    type: 'custom', deletable: true,
    startDate: getToday(), longestStreak: 0,
    breakHistory: [], todayChecked: false, checkedDate: ''
  })
  saveTrackers(trackers)
  return trackers
}

function deleteTracker(id) {
  let trackers = getTrackers()
  trackers = trackers.filter(t => !t.deletable || t.id !== id)
  saveTrackers(trackers)
  return trackers
}

// ========== 追踪器操作 ==========
function getTrackerDays(trackerId) {
  const trackers = getTrackers()
  const t = trackers.find(tr => tr.id === trackerId)
  if (!t || !t.startDate) return 0
  const start = new Date(t.startDate)
  const today = new Date(getToday())
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function getTrackerVitality(trackerId) {
  return calcVitality(getTrackerDays(trackerId))
}

function isTrackerCheckedInToday(trackerId) {
  const trackers = getTrackers()
  const t = trackers.find(tr => tr.id === trackerId)
  if (!t) return false
  const today = getToday()
  // 跨天自动重置
  if (t.checkedDate !== today) {
    t.todayChecked = false
    t.checkedDate = today
    saveTrackers(trackers)
  }
  return t.todayChecked
}

function doTrackerCheckin(trackerId) {
  const trackers = getTrackers()
  const t = trackers.find(tr => tr.id === trackerId)
  if (!t) return false
  const today = getToday()
  if (t.checkedDate !== today) t.todayChecked = false
  if (t.todayChecked) return false
  t.todayChecked = true
  t.checkedDate = today
  saveTrackers(trackers)
  return true
}

function breakTracker(trackerId) {
  const trackers = getTrackers()
  const t = trackers.find(tr => tr.id === trackerId)
  if (!t) return null
  const days = getTrackerDays(trackerId)
  const vitality = calcVitality(days)

  t.breakHistory.push({ date: getToday(), days, vitality })

  if (days > t.longestStreak) t.longestStreak = days

  const newVitality = Math.round(vitality * 0.6)
  const offsetDays = Math.floor((newVitality / 100) * VITALITY_CYCLE)
  const todayDt = new Date(getToday())
  todayDt.setDate(todayDt.getDate() - offsetDays)
  t.startDate = `${todayDt.getFullYear()}-${String(todayDt.getMonth() + 1).padStart(2, '0')}-${String(todayDt.getDate()).padStart(2, '0')}`
  t.todayChecked = false
  t.checkedDate = ''

  saveTrackers(trackers)
  return { oldVitality: vitality, newVitality: calcVitality(getTrackerDays(trackerId)) }
}

// ========== 健身记录（运动详情） ==========
function getFitnessLogs() {
  return wx.getStorageSync('fitnessLogs') || []
}

function addFitnessLog(log) {
  const logs = getFitnessLogs()
  logs.push({ date: getToday(), type: log.type || '运动', duration: log.duration || 0 })
  wx.setStorageSync('fitnessLogs', logs)
  return logs
}

// ========== 统计 ==========
function getMonthStats(monthStr) {
  const trackers = getTrackers()
  const logs = getFitnessLogs()
  let fitDays = 0, fitMinutes = 0
  const customStats = {}

  trackers.forEach(t => {
    if (t.type === 'custom') customStats[t.id] = { name: t.name, count: 0 }
  })

  trackers.forEach(t => {
    t.breakHistory.forEach(h => {
      if (h.date.startsWith(monthStr)) {
        if (t.type === 'fitness') fitDays++
        if (customStats[t.id]) customStats[t.id].count++
      }
    })
  })

  logs.forEach(log => {
    if (log.date.startsWith(monthStr)) fitMinutes += (log.duration || 0)
  })

  return { fitDays, fitMinutes, customStats: Object.values(customStats) }
}

function getTrackerHistory(trackerId) {
  const trackers = getTrackers()
  const t = trackers.find(tr => tr.id === trackerId)
  if (!t) return []
  const history = [...t.breakHistory]
  const days = getTrackerDays(trackerId)
  if (days > 0) history.push({ date: getToday(), days, current: true })
  return history.slice(-30)
}

// ========== 旧数据兼容（静默迁移） ==========
function migrateOldData() {
  if (wx.getStorageSync('_migrated')) return
  // 检查是否有旧数据需要迁移... 简单标记即可
  wx.setStorageSync('_migrated', true)
}

migrateOldData()

module.exports = {
  getSettings,
  saveSettings,
  getTrackers,
  saveTrackers,
  addTracker,
  deleteTracker,
  getTrackerDays,
  getTrackerVitality,
  isTrackerCheckedInToday,
  doTrackerCheckin,
  breakTracker,
  getFitnessLogs,
  addFitnessLog,
  getMonthStats,
  getTrackerHistory,
  // 兼容旧API
  getVitality: () => getTrackerVitality('abstinence'),
  doAbstinenceCheckin: () => doTrackerCheckin('abstinence'),
  isAbstinenceCheckedInToday: () => isTrackerCheckedInToday('abstinence'),
  breakAbstinence: () => breakTracker('abstinence'),
  getAbstinenceDays: () => getTrackerDays('abstinence'),
  getAbstinence: () => {
    const trackers = getTrackers()
    return trackers.find(t => t.id === 'abstinence')
  },
  getAbstinenceHistory: () => getTrackerHistory('abstinence')
}
