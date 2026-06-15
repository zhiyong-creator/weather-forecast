let utils = require('../../utils/utils')
let api = require('../../services/api')
let weatherService = require('../../services/weather')
let events = require('../../utils/events')
let globalData = getApp().globalData

Page({
  data: {
    isIPhoneX: globalData.isIPhoneX,
    message: '',
    weatherNow: {},
    hourlyDatas: [],
    lifeIndices: [],
    dailyForecast: [],
    weatherIconUrl: globalData.weatherIconUrl,
    userInfo: null,
    detailsDic: {
      key: ['temp', 'feelsLike', 'humidity', 'precip', 'windDir', 'wind360', 'windScale', 'windSpeed', 'vis', 'pressure', 'cloud', ''],
      val: {
        temp: '温度(℃)',
        feelsLike: '体感温度(℃)',
        humidity: '相对湿度(%)',
        precip: '降水量(mm)',
        windDir: '风向',
        wind360: '风向角度(deg)',
        windScale: '风力(级)',
        windSpeed: '风速(mk/h)',
        vis: '能见度(km)',
        pressure: '气压(mb)',
        cloud: '云量',
      },
    },
    searchText: '',
    located: true,
    searchCity: '',
    setting: {},
    bcgImgList: [
      { src: '/img/qing.jpg', topColor: '#0085e5' },
      { src: '/img/yu.jpg', topColor: '#0e202c' },
      { src: '/img/xue.jpg', topColor: '#0f0e1c' },
      { src: '/img/yun.jpg', topColor: '#004092' },
      { src: '/img/wu.jpg', topColor: '#d3ebf5' },
      { src: '/img/yin.jpg', topColor: '#2d2225' },
      { src: '/img/bg5.jpg', topColor: '#b8bab9' },
    ],
    bcgImgIndex: 0,
    bcgImg: '',
    bcgImgAreaShow: false,
    bcgColor: '#2d2225',
    showHeartbeat: true,
    enableSearch: true,
    openSettingButtonShow: false,
    shareInfo: {},
  },

  // ---- 生命周期 ----
  onLoad() {
    this._onWeatherRefresh = (name) => this.onWeatherRefresh(name)
    this._onSettingChanged = () => this.reloadInitSetting()
    events.on('weatherRefresh', this._onWeatherRefresh)
    events.on('settingChanged', this._onSettingChanged)
    let cachedUserInfo = wx.getStorageSync('userInfo')
    if (cachedUserInfo) {
      this.setData({ userInfo: cachedUserInfo })
    }
    this.reloadPage()
  },
  onUnload() {
    events.off('weatherRefresh', this._onWeatherRefresh)
    events.off('settingChanged', this._onSettingChanged)
  },
  onShow() {
    let cachedUserInfo = wx.getStorageSync('userInfo')
    if (cachedUserInfo) {
      this.setData({ userInfo: cachedUserInfo })
    }
    if (!utils.isEmptyObject(this.data.shareInfo)) {
      return
    }
  },
  onPullDownRefresh() {
    if (this._loading) return
    this._loading = true
    this.init()
  },
  onShareAppMessage() {
    let shareInfo = this.data.shareInfo
    return {
      title: shareInfo.title || '天气早知道',
      path: shareInfo.path || '/pages/index/index',
      imageUrl: '/img/share.jpg',
    }
  },

  // ---- 事件回调 ----
  onWeatherRefresh: function (name) {
    if (name) {
      this.search(name)
    } else {
      this.init()
    }
  },

  // ---- 页面刷新 ----
  reloadPage() {
    this.loadCachedWeather()
    this.reloadInitSetting()
    this.reloadWeather()
  },
  reloadWeather() {
    if (this.data.located) {
      this.init()
    } else {
      this.search(this.data.searchCity)
      this.setData({ searchCity: '' })
    }
  },

  // ---- 天气加载 ----
  loadWeather(location, cityName) {
    wx.showLoading({ title: '加载中' })
    Promise.all([
      api.getWeatherNow(location).catch(function () { return null }),
      api.getWeather24h(location).catch(function () { return null }),
      api.getWeather3d(location).catch(function () { return null }),
      api.getIndices(location).catch(function () { return null }),
    ]).then((results) => {
      wx.hideLoading()
      wx.stopPullDownRefresh()
      let nowData = results[0]
      let hourlyData = results[1]
      let dailyData = results[2]
      let indicesData = results[3]
      let updateData = {}

      if (nowData) {
        let parsed = weatherService.parseNowWeather(nowData.now, nowData.fxLink, cityName || location)
        updateData.weatherNow = parsed
        let bg = weatherService.getBackgroundByWeather(parsed.text)
        updateData.bcgImg = bg.src
        updateData.bcgColor = bg.topColor
        this.setNavigationBarColor(bg.topColor)

        wx.setStorage({ key: 'weatherNow', data: parsed })
        wx.setStorage({ key: 'bcgImg', data: bg.src })
        wx.setStorage({ key: 'bcgColor', data: bg.topColor })
      }

      if (hourlyData) {
        updateData.hourlyDatas = weatherService.parseHourlyWeather(hourlyData.hourly)
      }

      if (dailyData) {
        updateData.dailyForecast = weatherService.parseDailyForecast(dailyData.daily)
      }

      if (indicesData) {
        updateData.lifeIndices = weatherService.parseIndices(indicesData.daily)
      }

      this.setData(updateData)
      this._loading = false
    }).catch(() => {
      wx.hideLoading()
      wx.stopPullDownRefresh()
      wx.showToast({ title: '网络不给力，请稍后再试', icon: 'none' })
      this._loading = false
    })
  },

  loadCachedWeather() {
    let that = this
    wx.getStorage({
      key: 'weatherNow',
      success: function (res) {
        if (res.data && res.data.text) {
          let bg = weatherService.getBackgroundByWeather(res.data.text)
          that.setData({
            weatherNow: res.data,
            bcgImg: bg.src,
            bcgColor: bg.topColor,
          })
          that.setNavigationBarColor(bg.topColor)
        }
      },
    })
  },

  // ---- 定位 ----
  init() {
    this.setData({ located: true })
    wx.getLocation({
      success: (res) => {
        let coordinates = res.longitude + ',' + res.latitude
        api.lookupCity(coordinates).then((data) => {
          let cityName = data.location && data.location[0] && data.location[0].name
          this.loadWeather(coordinates, cityName)
        }).catch(() => {
          this.loadWeather(coordinates)
        })
      },
      fail: (res) => {
        let errMsg = (res && res.errMsg) || ''
        if (errMsg.indexOf('deny') !== -1 || errMsg.indexOf('denied') !== -1) {
          this.handleLocationDenied()
        } else {
          let defaultCity = '101010100'
          this.loadWeather(defaultCity)
          this.setData({ searchCity: defaultCity })
        }
      },
    })
  },

  handleLocationDenied() {
    wx.stopPullDownRefresh()
    this._loading = false
    wx.showToast({
      title: '需要开启地理位置权限',
      icon: 'none',
      duration: 2500,
      success: () => {
        if (this.canUseOpenSettingApi()) {
          setTimeout(function () {
            wx.openSetting({})
          }, 2500)
        } else {
          this.setData({ openSettingButtonShow: true })
        }
      },
    })
  },

  // ---- 搜索 ----
  commitSearch(res) {
    let val = ((res.detail || {}).value || '').replace(/\s+/g, '')
    this.search(val)
  },
  search(val, callback) {
    if (val === '520' || val === '521') {
      this.clearInput()
      this.dance()
      callback && callback()
      return
    }
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
    if (val) {
      this.setData({ located: false })
      api.lookupCity(val).then((data) => {
        if (data.location && data.location.length > 0) {
          this.loadWeather(data.location[0].id, data.location[0].name)
        } else {
          wx.showToast({ title: '未找到该城市', icon: 'none' })
        }
      }).catch(() => {
        wx.showToast({ title: '未找到该城市', icon: 'none' })
      })
    }
    callback && callback()
  },
  clearInput() {
    this.setData({ searchText: '' })
  },

  // ---- 设置 ----
  reloadInitSetting() {
    this.initSetting((setting) => {
      this.checkUpdate(setting)
    })
  },
  initSetting(successFunc) {
    wx.getStorage({
      key: 'setting',
      success: (res) => {
        this.setData({ setting: res.data || {} })
        successFunc && successFunc(res.data || {})
      },
      fail: () => {
        this.setData({ setting: {} })
      },
    })
  },
  checkUpdate(setting) {
    if (!setting.forceUpdate || !wx.getUpdateManager) return
    let updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已下载完成，是否重启应用？',
        success: function (res) {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        },
      })
    })
  },
  canUseOpenSettingApi() {
    let systeminfo = getApp().globalData.systeminfo
    let SDKVersion = systeminfo.SDKVersion
    let version = utils.cmpVersion(SDKVersion, '2.0.7')
    return version < 0
  },

  // ---- 导航栏 ----
  setNavigationBarColor(color) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: color || this.data.bcgColor,
    })
  },

  // ---- 背景图 ----
  showBcgImgArea() {
    this.setData({ bcgImgAreaShow: true })
  },
  hideBcgImgArea() {
    this.setData({ bcgImgAreaShow: false })
  },
  chooseBcg(e) {
    let dataset = e.currentTarget.dataset
    let index = dataset.index
    this.setBcgImg(index)
    wx.setStorage({ key: 'bcgImgIndex', data: index })
  },
  setBcgImg(index) {
    let list = this.data.bcgImgList
    if (typeof index === 'number' && list[index]) {
      this.setData({
        bcgImg: list[index].src,
        bcgColor: list[index].topColor,
        bcgImgIndex: index,
        bcgImgAreaShow: false,
      })
      this.setNavigationBarColor(list[index].topColor)
    } else {
      wx.getStorage({
        key: 'bcgImgIndex',
        success: (res) => {
          let i = res.data
          if (typeof i === 'number' && list[i]) {
            this.setData({
              bcgImg: list[i].src,
              bcgColor: list[i].topColor,
              bcgImgIndex: i,
            })
            this.setNavigationBarColor(list[i].topColor)
          }
        },
      })
    }
  },

  // ---- 城市选择 ----
  toCitychoose() {
    wx.navigateTo({ url: '/pages/citychoose/citychoose' })
  },

  // ---- 心跳彩蛋 ----
  dance() {
    this.setData({ enableSearch: false })
    let heartbeat = this.selectComponent('#heartbeat')
    heartbeat.dance(() => {
      this.setData({ showHeartbeat: false, enableSearch: true })
      this.setData({ showHeartbeat: true })
    })
  },
})
