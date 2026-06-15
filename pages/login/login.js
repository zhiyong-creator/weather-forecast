Page({
  data: {
    canLogin: true,
  },

  onLoginTap() {
    this.setData({ canLogin: false })
    wx.showLoading({ title: '登录中...' })

    wx.login({
      success: (res) => {
        if (res.code) {
          let userInfo = {
            avatarUrl: '/img/weather.png',
            nickName: '微信用户',
          }
          wx.setStorageSync('userInfo', userInfo)
          wx.setStorageSync('loginCode', res.code)
          wx.hideLoading()
          wx.reLaunch({ url: '/pages/index/index' })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '登录失败，请重试', icon: 'none' })
          this.setData({ canLogin: true })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络异常，请重试', icon: 'none' })
        this.setData({ canLogin: true })
      },
    })
  },
})
