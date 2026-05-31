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
    wx.getStorage({
      key: 'setting',
      success: (res) => {
        this.setData({ setting: res.data })
      },
      fail: () => {
        this.setData({ setting: {} })
      },
    })
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
                that.setData({ setting: {}, pos: {} })
                events.emit('settingChanged')
              },
            })
          }
        },
      })
    }
  },
})
