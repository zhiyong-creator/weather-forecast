let globalData = getApp().globalData

function request(url, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      data: Object.assign({ key: globalData.key }, data),
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === '200') {
          resolve(res.data)
        } else {
          reject(res.data || {})
        }
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}

function getWeatherNow(location) {
  return request(globalData.requestUrl.weather, { location })
}

function getWeather24h(location) {
  return request(globalData.requestUrl.hourly, { location })
}

function getWeather3d(location) {
  return request(globalData.requestUrl.daily, { location })
}

function lookupCity(cityName) {
  return request(globalData.requestUrl.geo, { location: cityName })
}

function getIndices(location) {
  return request(globalData.requestUrl.indices, { location, type: '1,2,3,5,6,8,9' })
}

module.exports = {
  getWeatherNow,
  getWeather24h,
  getWeather3d,
  lookupCity,
  getIndices,
}
