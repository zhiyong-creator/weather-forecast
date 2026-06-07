App({
  onLaunch() {
    try {
      let windowInfo = wx.getWindowInfo()
      let deviceInfo = wx.getDeviceInfo()
      this.globalData.systeminfo = Object.assign({}, windowInfo, deviceInfo)
      this.globalData.isIPhoneX = /iphone\s?x/gi.test(deviceInfo.model.replace(/\s+/g, ''))
    } catch (e) {
      this.globalData.systeminfo = {}
    }
  },
  globalData: {
    keepscreenon: false,
    systeminfo: {},
    isIPhoneX: false,
    key: '9cad8bce59904f4699ac9f275db3e091',
    weatherIconUrl: '',
    requestUrl: {
      weather: 'https://pv6apvmwqk.re.qweatherapi.com/v7/weather/now',
      hourly: 'https://pv6apvmwqk.re.qweatherapi.com/v7/weather/24h',
      daily: 'https://pv6apvmwqk.re.qweatherapi.com/v7/weather/3d',
      geo: 'https://pv6apvmwqk.re.qweatherapi.com/geo/v2/city/lookup',
      indices: 'https://pv6apvmwqk.re.qweatherapi.com/v7/indices/1d',
    },
  },
})
