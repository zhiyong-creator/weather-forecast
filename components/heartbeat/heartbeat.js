Component({
  data: {
    windowWidth: 0,
    windowHeight: 0,
    arr: [],
    duration: 5000,
    animations: [],
    lefts: [],
    tops: [],
    widths: [],
  },
  properties: {
    show: {
      type: Boolean,
      value: true
    },
  },
  ready() {
    try {
      let info = wx.getWindowInfo()
      this.setData({
        windowWidth: info.windowWidth || info.screenWidth,
        windowHeight: info.windowHeight || info.screenHeight,
      })
    } catch (e) {
      this.setData({ windowWidth: 375, windowHeight: 667 })
    }
    let num = parseInt(Math.random() * 100) + 10
    let arr = Array.apply(null, { length: num }).map(function (value, index) {
      return index + 1
    })
    this.setData({ arr: arr })
  },
  methods: {
    dance(callback) {
      let windowWidth = this.data.windowWidth
      let windowHeight = this.data.windowHeight
      let duration = this.data.duration
      let animations = []
      let lefts = []
      let tops = []
      let widths = []
      for (let i = 0; i < this.data.arr.length; i++) {
        lefts.push(Math.random() * windowWidth)
        tops.push(-140)
        widths.push(Math.random() * 50 + 40)
        let animation = wx.createAnimation({
          duration: Math.random() * (duration - 1000) + 1000
        })
        animation.top(windowHeight).left(Math.random() * windowWidth).rotate(Math.random() * 960).step()
        animations.push(animation.export())
      }
      this.setData({ lefts: lefts, tops: tops, widths: widths })
      let timer = setTimeout(() => {
        this.setData({ animations: animations })
        clearTimeout(timer)
      }, 200)
      let end = setTimeout(() => {
        callback && callback()
        clearTimeout(end)
      }, duration)
    },
  },
})
