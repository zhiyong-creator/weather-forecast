let utils = require('../utils/utils')

let bgMap = {
  '晴': { src: '/img/qing.jpg', topColor: '#0085e5' },
  '雨': { src: '/img/yu.jpg', topColor: '#0e202c' },
  '雪': { src: '/img/xue.jpg', topColor: '#0f0e1c' },
  '云': { src: '/img/yun.jpg', topColor: '#004092' },
  '雾': { src: '/img/wu.jpg', topColor: '#d3ebf5' },
  '阴': { src: '/img/yin.jpg', topColor: '#2d2225' },
}
let defaultBg = { src: '/img/bg5.jpg', topColor: '#b8bab9' }

function getBackgroundByWeather(text) {
  if (!text) return defaultBg
  for (let keyword in bgMap) {
    if (text.indexOf(keyword) >= 0) {
      return bgMap[keyword]
    }
  }
  return defaultBg
}

function parseNowWeather(nowData, fxLink, location) {
  let loc = location
  if (fxLink) {
    let match = fxLink.match(/weather\/(.+?)-\d+/)
    if (match) {
      loc = match[1]
    }
  }
  let now = new Date()
  return {
    temp: nowData.temp,
    feelsLike: nowData.feelsLike,
    humidity: nowData.humidity,
    precip: nowData.precip,
    windDir: nowData.windDir,
    wind360: nowData.wind360,
    windScale: nowData.windScale,
    windSpeed: nowData.windSpeed,
    vis: nowData.vis,
    pressure: nowData.pressure,
    cloud: nowData.cloud,
    text: nowData.text,
    icon: nowData.icon,
    location: loc,
    updateTime: now.getTime(),
    updateTimeFormat: utils.formatDate(now, 'MM-dd hh:mm'),
  }
}

function parseHourlyWeather(hourlyList) {
  return (hourlyList || []).map(function (item) {
    var time = ''
    if (item.fxTime) {
      time = item.fxTime.slice(11, 16)
    }
    return {
      temp: item.temp,
      text: item.text,
      icon: item.icon,
      windDir: item.windDir,
      windScale: item.windScale,
      humidity: item.humidity,
      fxTime: item.fxTime,
      time: time,
    }
  })
}

function getDayLabel(dateStr) {
  if (!dateStr) return ''
  var now = new Date()
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  var date = new Date(dateStr)
  var diff = Math.round((date - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === 2) return '后天'
  return dateStr.slice(5)
}

function parseDailyForecast(dailyList) {
  return (dailyList || []).map(function (item) {
    return {
      fxDate: item.fxDate,
      dayLabel: getDayLabel(item.fxDate),
      tempMax: item.tempMax,
      tempMin: item.tempMin,
      textDay: item.textDay,
      iconDay: item.iconDay,
      textNight: item.textNight,
      iconNight: item.iconNight,
      windDirDay: item.windDirDay,
      windScaleDay: item.windScaleDay,
    }
  })
}

var lifestyleIconMap = {
  '1': 'sport',
  '2': 'cw',
  '3': 'drsg',
  '5': 'uv',
  '6': 'trav',
  '8': 'comf',
  '9': 'flu',
}

function parseIndices(indicesList) {
  return (indicesList || []).map(function (item) {
    var iconName = lifestyleIconMap[item.type] || ''
    return {
      name: item.name,
      category: item.category,
      level: item.level,
      text: item.text,
      type: item.type,
      icon: iconName ? '/img/lifestyle_' + iconName + '.png' : '',
    }
  })
}

module.exports = {
  parseNowWeather,
  parseHourlyWeather,
  parseDailyForecast,
  parseIndices,
  getBackgroundByWeather,
}
