App({
  onLaunch() {
    // wx.cloud.init({
    //   env: '',
    //   traceUser: true,
    // })
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systeminfo = res
        this.globalData.isIPhoneX = /iphonex/gi.test(res.model.replace(/\s+/, ''))
      },
    })
  },
  globalData: {
    // 是否保持常亮，离开小程序失效
    keepscreenon: false,
    systeminfo: {},
    isIPhoneX: false,
    key: '9cad8bce59904f4699ac9f275db3e091',
    weatherIconUrl: '',
    requestUrl: {
      weather: 'https://pv6apvmwqk.re.qweatherapi.com/v7/weather/now',
      hourly: 'https://pv6apvmwqk.re.qweatherapi.com/v7/weather/24h',
    },
  },
})
