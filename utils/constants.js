// 常量配置

// 鼓励文案（根据坚持天数）
const encouragements = [
  { min: 0, max: 0, text: '千里之行，始于足下 💪' },
  { min: 1, max: 2, text: '好的开始是成功的一半！🔥' },
  { min: 3, max: 6, text: '每一天都在变强，坚持住！🌟' },
  { min: 7, max: 13, text: '一周了！你已经开始蜕变 🦋' },
  { min: 14, max: 20, text: '两周的坚持，自律正在成为习惯 ✨' },
  { min: 21, max: 29, text: '21天！新习惯已经养成 🏆' },
  { min: 30, max: 59, text: '一个月了！你已超越了大多数的人 🥇' },
  { min: 60, max: 89, text: '两个月！自律已经刻进骨子里 💎' },
  { min: 90, max: 179, text: '三个月！你是真正的自律大师 👑' },
  { min: 180, max: 364, text: '半年坚持！你的人生已完全不同 🚀' },
  { min: 365, max: Infinity, text: '一整年！传奇就是你 🔥👑' }
]

// 健身运动类型
const exerciseTypes = ['跑步', '力量训练', '游泳', '骑行', '跳绳', '瑜伽', '篮球', '足球', '羽毛球', '散步', 'HIIT', '其他']

// 自定义模块可选图标
const moduleIcons = ['📖', '✍️', '🧘', '💧', '🍎', '😴', '🧹', '💻', '🎯', '🎨', '🎵', '🧠', '💰', '🚭', '🍺', '📱', '🌅', '💊']

// 默认配置
const defaultConfig = {
  male: {
    abstinenceLabel: '戒撸',
    themeColor: '#4A90D9',
    themeLight: '#E8F2FC'
  },
  female: {
    abstinenceLabel: '戒自慰',
    themeColor: '#9B7ED8',
    themeLight: '#F2EDFA'
  }
}

// 获取鼓励语
function getEncouragement(days) {
  for (let e of encouragements) {
    if (days >= e.min && days <= e.max) return e.text
  }
  return encouragements[encouragements.length - 1].text
}

// 获取今日日期字符串
function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 日期格式化显示
function formatDate(dateStr) {
  if (!dateStr) return '--'
  const parts = dateStr.split('-')
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`
}

// 获取星期
function getWeekday() {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return '星期' + days[new Date().getDay()]
}

module.exports = {
  encouragements,
  exerciseTypes,
  moduleIcons,
  defaultConfig,
  getEncouragement,
  getToday,
  formatDate,
  getWeekday
}
