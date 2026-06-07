let utils = require('../../utils/utils')
let api = require('../../services/api')
let weatherService = require('../../services/weather')
let events = require('../../utils/events')
let globalData = getApp().globalData
let SYSTEMINFO = globalData.systeminfo

Page({
  data: {
    isIPhoneX: globalData.isIPhoneX,
    message: '',
    weatherNow: {},
    hourlyDatas: [],
    lifeIndices: [],
    dailyForecast: [],
    weatherIconUrl: globalData.weatherIconUrl,
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
    hasPopped: false,
    animationMain: {},
    animationOne: {},
    animationTwo: {},
    animationFour: {},
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
    events.on('weatherRefresh', this.onWeatherRefresh)
    events.on('settingChanged', this.reloadInitSetting)
    this.reloadPage()
  },
  onUnload() {
    events.off('weatherRefresh', this.onWeatherRefresh)
    events.off('settingChanged', this.reloadInitSetting)
  },
  onShow() {
    if (!utils.isEmptyObject(this.data.shareInfo)) {
      return
    }
  },
  onPullDownRefresh() {
    this.reloadPage()
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
  loadWeather(location) {
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
        let parsed = weatherService.parseNowWeather(nowData.now, nowData.fxLink, location)
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
    }).catch(() => {
      wx.hideLoading()
      wx.stopPullDownRefresh()
      wx.showToast({ title: '网络不给力，请稍后再试', icon: 'none' })
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
        this.loadWeather(res.longitude + ',' + res.latitude)
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
          this.loadWeather(data.location[0].id)
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

  // ---- 菜单 ----
  menuHide() {
    if (this.data.hasPopped) {
      this.takeback()
      this.setData({ hasPopped: false })
    }
  },
  menuMain() {
    if (!this.data.hasPopped) {
      this.popp()
      this.setData({ hasPopped: true })
    } else {
      this.takeback()
      this.setData({ hasPopped: false })
    }
  },
  menuMainMove(e) {
    if (this.data.hasPopped) {
      this.takeback()
      this.setData({ hasPopped: false })
    }
    let windowWidth = SYSTEMINFO.windowWidth
    let windowHeight = SYSTEMINFO.windowHeight
    let touches = e.touches[0]
    let clientX = touches.clientX
    let clientY = touches.clientY
    if (clientX > windowWidth - 40) clientX = windowWidth - 40
    if (clientX <= 90) clientX = 90
    if (clientY > windowHeight - 40 - 60) clientY = windowHeight - 40 - 60
    if (clientY <= 60) clientY = 60
    this.setData({ pos: { left: clientX, top: clientY } })
  },
  menuToCitychoose() {
    this.menuMain()
    wx.navigateTo({ url: '/pages/citychoose/citychoose' })
  },
  menuToSetting() {
    this.menuMain()
    wx.navigateTo({ url: '/pages/setting/setting' })
  },
  popp() {
    let animationMain = wx.createAnimation({ duration: 200, timingFunction: 'ease-out' })
    let animationOne = wx.createAnimation({ duration: 200, timingFunction: 'ease-out' })
    let animationTwo = wx.createAnimation({ duration: 200, timingFunction: 'ease-out' })
    let animationFour = wx.createAnimation({ duration: 200, timingFunction: 'ease-out' })
    animationMain.rotateZ(180).step()
    animationOne.translate(-30, -45).rotateZ(180).opacity(1).step()
    animationTwo.translate(-75, 0).rotateZ(180).opacity(1).step()
    animationFour.translate(-30, 45).rotateZ(180).opacity(1).step()
    this.setData({
      animationMain: animationMain.export(),
      animationOne: animationOne.export(),
      animationTwo: animationTwo.export(),
      animationFour: animationFour.export(),
    })
  },
  takeback() {
    let animationMain = wx.createAnimation({ duration: 200, timingFunction: 'ease-out' })
    let animationOne = wx.createAnimation({ duration: 200, timingFunction: 'ease-out' })
    let animationTwo = wx.createAnimation({ duration: 200, timingFunction: 'ease-out' })
    let animationFour = wx.createAnimation({ duration: 200, timingFunction: 'ease-out' })
    animationMain.rotateZ(0).step()
    animationOne.translate(0, 0).rotateZ(0).opacity(0).step()
    animationTwo.translate(0, 0).rotateZ(0).opacity(0).step()
    animationFour.translate(0, 0).rotateZ(0).opacity(0).step()
    this.setData({
      animationMain: animationMain.export(),
      animationOne: animationOne.export(),
      animationTwo: animationTwo.export(),
      animationFour: animationFour.export(),
    })
  },
})
