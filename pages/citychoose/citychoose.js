let staticData = require('../../data/staticData.js')
let utils = require('../../utils/utils.js')
let events = require('../../utils/events.js')

Page({
  data: {
    alternative: null,
    cities: [],
    showItems: null,
    inputText: '',
    hotCities: [],
  },
  cancel() {
    this.setData({
      inputText: '',
      showItems: this.data.cities,
    })
  },
  inputFilter(e) {
    let alternative = {}
    let cities = this.data.cities
    let value = e.detail.value.replace(/\s+/g, '')
    if (value.length) {
      for (let i in cities) {
        let items = cities[i]
        for (let j = 0, len = items.length; j < len; j++) {
          let item = items[j]
          if (item.name.indexOf(value) !== -1) {
            if (utils.isEmptyObject(alternative[i])) {
              alternative[i] = []
            }
            alternative[i].push(item)
          }
        }
      }
      if (utils.isEmptyObject(alternative)) {
        alternative = null
      }
      this.setData({ alternative: alternative, showItems: alternative })
    } else {
      this.setData({ alternative: null, showItems: cities })
    }
  },
  getSortedAreaObj(areas) {
    areas = areas.sort(function (a, b) {
      if (a.letter > b.letter) return 1
      if (a.letter < b.letter) return -1
      return 0
    })
    let obj = {}
    for (let i = 0, len = areas.length; i < len; i++) {
      let item = areas[i]
      delete item.districts
      let letter = item.letter
      if (!obj[letter]) {
        obj[letter] = []
      }
      obj[letter].push(item)
    }
    return obj
  },
  choose(e) {
    let name = e.currentTarget.dataset.name
    events.emit('weatherRefresh', name || null)
    wx.navigateBack({})
  },
  onLoad() {
    let hotCities = getApp().globalData.hotCities || staticData.hotCities || []
    let cities = this.getSortedAreaObj(staticData.cities || [])
    this.setData({
      hotCities: hotCities,
      cities: cities,
      showItems: cities,
    })
  },
})
