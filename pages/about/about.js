let utils = require('../../utils/utils')

Page({
  data: {
    email: '383755537@qq.com',
    qq: '383755537',
    swiperHeight: 'auto',
    bannerImgList: [
      {
        src: 'https://raw.githubusercontent.com/zhangliwen1101/Images/master/img/weather.jpg',
        title: 'Weather Widget',
      },
      {
        src: 'https://raw.githubusercontent.com/zhangliwen1101/Images/master/img/weather.jpg',
        title: 'Weather Widget',
      },
      {
        src: 'https://raw.githubusercontent.com/zhangliwen1101/Images/master/img/wait.jpg',
        title: 'Weather Widget',
      },
    ],
  },
  onLoad() {
    this.initSwiper()
  },
  previewImages(e) {
    let index = e.currentTarget.dataset.index || 0
    let urls = this.data.bannerImgList
    let arr = urls.map(function (item) { return item.src })
    wx.previewImage({
      current: arr[index],
      urls: arr,
    })
  },
  initSwiper() {
    try {
      let info = wx.getWindowInfo()
      this.setSwiperHeight(info)
    } catch (e) {
      let systeminfo = getApp().globalData.systeminfo
      if (!utils.isEmptyObject(systeminfo)) {
        this.setSwiperHeight(systeminfo)
      }
    }
  },
  setSwiperHeight(res) {
    this.setData({
      swiperHeight: ((res.windowWidth || res.screenWidth) / 375 * 200) + 'px'
    })
  },
  copy(e) {
    let dataset = (e.currentTarget || {}).dataset || {}
    let title = dataset.title || ''
    let content = dataset.content || ''
    wx.setClipboardData({
      data: content,
      success: function () {
        wx.showToast({ title: '已复制' + title, duration: 2000 })
      },
    })
  },
})
