let utils = require('../../utils/utils')
let events = require('../../utils/events')

Page({
  data: {
    setting: {},
    show: false,
    screenBrightness: '获取中',
    keepscreenon: false,
    SDKVersion: '',
    enableUpdate: true,
    userInfo: null,
  },
  switchChange(e) {
    let dataset = e.currentTarget.dataset
    let switchparam = dataset.switchparam
    let setting = this.data.setting
    if (switchparam === 'forceUpdate') {
      if (this.data.enableUpdate) {
        setting[switchparam] = (e.detail || {}).value
      } else {
        setting[switchparam] = false
        wx.showToast({
          title: '基础库版本较高，无法使用该功能',
          icon: 'none',
          duration: 2000,
        })
      }
    } else if (switchparam === 'keepscreenon') {
      this.setKeepScreenOn(!this.data.keepscreenon)
      getApp().globalData.keepscreenon = !this.data.keepscreenon
    } else {
      setting[switchparam] = !(e.detail || {}).value
    }
    this.setData({ setting: setting })
    wx.setStorage({
      key: 'setting',
      data: setting,
      success: function () {
        events.emit('settingChanged')
      },
    })
  },
  hide() {
    this.setData({ show: false })
  },
  updateInstruc() {
    this.setData({ show: true })
  },
  onShow() {
    this.setData({ keepscreenon: getApp().globalData.keepscreenon })
    this.ifDisableUpdate()
    this.getScreenBrightness()
    let cachedSetting = wx.getStorageSync('setting')
    if (cachedSetting) {
      this.setData({ setting: cachedSetting })
    }
    let cachedUserInfo = wx.getStorageSync('userInfo')
    if (cachedUserInfo) {
      this.setData({ userInfo: cachedUserInfo })
    }
  },
  ifDisableUpdate() {
    let systeminfo = getApp().globalData.systeminfo
    let SDKVersion = systeminfo.SDKVersion
    let version = utils.cmpVersion(SDKVersion, '1.9.90')
    if (version >= 0) {
      this.setData({ SDKVersion: SDKVersion, enableUpdate: true })
    } else {
      this.setData({ SDKVersion: SDKVersion, enableUpdate: false })
    }
  },
  getHCEState() {
    wx.showLoading({ title: '检测中...' })
    wx.getHCEState({
      success: function () {
        wx.hideLoading()
        wx.showModal({
          title: '检测结果',
          content: '该设备支持NFC功能',
          showCancel: false,
          confirmText: '朕知道了',
          confirmColor: '#40a7e7',
        })
      },
      fail: function () {
        wx.hideLoading()
        wx.showModal({
          title: '检测结果',
          content: '该设备不支持NFC功能',
          showCancel: false,
          confirmText: '朕知道了',
          confirmColor: '#40a7e7',
        })
      },
    })
  },
  getScreenBrightness() {
    wx.getScreenBrightness({
      success: (res) => {
        this.setData({ screenBrightness: Number(res.value * 100).toFixed(0) })
      },
      fail: () => {
        this.setData({ screenBrightness: '获取失败' })
      },
    })
  },
  screenBrightnessChanging(e) {
    this.setScreenBrightness(e.detail.value)
  },
  setScreenBrightness(val) {
    wx.setScreenBrightness({
      value: val / 100,
      success: () => {
        this.setData({ screenBrightness: val })
      },
    })
  },
  setKeepScreenOn(b) {
    wx.setKeepScreenOn({
      keepScreenOn: b,
      success: () => {
        this.setData({ keepscreenon: b })
      },
    })
  },
  getsysteminfo() {
    wx.navigateTo({ url: '/pages/systeminfo/systeminfo' })
  },
  // ---- 登录相关 ----
  onGetUserInfo() {
    wx.showLoading({ title: '登录中...' })
    wx.login({
      success: (res) => {
        if (res.code) {
          let userInfo = {
            avatarUrl: '/img/weather.png',
            nickName: '微信用户',
          }
          wx.setStorage({ key: 'userInfo', data: userInfo })
          wx.setStorage({ key: 'loginCode', data: res.code })
          this.setData({ userInfo: userInfo })
          wx.hideLoading()
          wx.showToast({ title: '登录成功', icon: 'success' })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '登录失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络异常', icon: 'none' })
      },
    })
  },
  onChooseAvatar(e) {
    let avatarUrl = e.detail.avatarUrl
    let userInfo = wx.getStorageSync('userInfo') || { nickName: '微信用户' }
    userInfo.avatarUrl = avatarUrl
    wx.setStorage({ key: 'userInfo', data: userInfo })
    this.setData({ userInfo: userInfo })
  },
  onNicknameInput(e) {
    let nickName = e.detail.value
    let userInfo = wx.getStorageSync('userInfo') || { avatarUrl: '/img/weather.png' }
    userInfo.nickName = nickName
    wx.setStorage({ key: 'userInfo', data: userInfo })
    this.setData({ userInfo: userInfo })
  },
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确认退出登录？退出后需重新登录',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorage({ key: 'userInfo' })
          wx.removeStorage({ key: 'loginCode' })
          this.setData({ userInfo: null })
          wx.showToast({ title: '已退出登录', icon: 'success' })
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/login/login' })
          }, 1500)
        }
      },
    })
  },

  removeStorage(e) {
    let that = this
    let datatype = e.currentTarget.dataset.type
    if (datatype === 'setting') {
      wx.showModal({
        title: '提示',
        content: '确认要初始化设置',
        cancelText: '容朕想想',
        confirmColor: '#40a7e7',
        success: function (res) {
          if (res.confirm) {
            wx.removeStorage({
              key: 'setting',
              success: function () {
                wx.showToast({ title: '设置已初始化' })
                that.setData({ setting: {} })
                events.emit('settingChanged')
              },
            })
          }
        },
      })
    } else if (datatype === 'all') {
      wx.showModal({
        title: '提示',
        content: '确认要删除',
        cancelText: '容朕想想',
        confirmColor: '#40a7e7',
        success: function (res) {
          if (res.confirm) {
            wx.clearStorage({
              success: function () {
                wx.showToast({ title: '数据已清除' })
                that.setData({ setting: {}, pos: {}, userInfo: null })
                events.emit('settingChanged')
              },
            })
          }
        },
      })
    }
  },
})
