# WeatherWidget - 天气预报小程序

## 项目配置信息（新会话必读）

### 和风天气 API 配置
- **API Key**: `9cad8bce59904f4699ac9f275db3e091`
- **API Host (专属域名)**: `pv6apvmwqk.re.qweatherapi.com`
- **API 版本**: v7
- **接口地址**:
  - 实时天气: `/v7/weather/now`
  - 24小时预报: `/v7/weather/24h`
  - 3天预报: `/v7/weather/3d`
  - 生活指数: `/v7/indices/1d` (type: 1,2,3,5,6,8,9)
  - 城市查询: `/geo/v2/city/lookup`
- **定位**: 使用 LocationID 或经纬度坐标
- **微信开发者工具**: 需勾选「不校验合法域名」
- **数据类型**: v7 格式 (temp/feelsLike/textDay/iconDay/windDirDay 等)

## 项目架构

```
WeatherWidget/
├── app.js                  # 全局入口 + 设备信息 + API Key + 请求地址
├── app.json                # 页面路由 + tabBar 配置
├── app.wxss                # 全局样式
├── project.config.json     # 项目配置
│
├── pages/
│   ├── index/              # 首页 - 天气主页面
│   ├── citychoose/         # 城市选择页
│   ├── setting/            # 设置页
│   └── systeminfo/         # 系统信息页
│
├── services/
│   ├── api.js              # API 层：和风天气 HTTP 请求 (Promise)
│   └── weather.js          # 数据解析层 + 背景图匹配 + 生活指数图标映射
│
├── utils/
│   ├── utils.js            # 工具函数 (formatDate, isEmptyObject, cmpVersion)
│   └── events.js           # 轻量事件总线 (on/off/emit)
│
├── components/
│   └── heartbeat/          # 爱心动画彩蛋组件 (搜索520/521触发)
│
├── data/
│   └── staticData.js       # 城市列表 + 热门城市数据
│
└── img/                    # 图标资源 (~48张)
    ├── weather.png / setting.png    # tabBar 图标 (81x81)
    ├── qing.jpg / yu.jpg / ...      # 7张可选背景图
    ├── lifestyle_*.png              # 14张生活指数图标
    └── ...                          # 其他图标资源
```

## tabBar 底部导航
- **首页**（weather.png 图标） → `pages/index/index`
- **设置**（setting.png 图标） → `pages/setting/setting`
- 选中高亮色 `#40a7e7`，未选中灰色 `#999`

## 页面功能

### 首页 (pages/index)
- **数据加载**: `Promise.all` 并发请求4个API（实时/24h预报/3天预报/指数）
- **城市显示**: 定位后通过 `lookupCity(坐标)` 反查中文城市名
- **页面模块**:
  1. **搜索栏** - 城市名搜索，带半透明背景 + text-shadow
  2. **顶栏** - 头像 + "更新于 MM-dd hh:mm"
  3. **当前天气** - 城市名(粗体+阴影) + 大字号温度 + 天气状况
  4. **逐时预报** - 水平滚动时序卡片（时间→温度→天气→风力），紧凑间距
  5. **3天预报** - 三列毛玻璃卡片（今天/明天/后天 + 温度渐变色条 + 天气 + 风力）
  6. **生活指数** - 水平滚动（图标 + 名称 + 金色等级 + 描述文字）
  7. **实时天气** - 网格12项详情（温度/体感/湿度/风向/风力/能见度等）
- **背景**: 7张风景图可切换，自动根据当前天气匹配
- **下拉刷新**: 带 `_loading` 防重入锁
- **文字清晰度**: 所有主要文字带 `text-shadow` 投影，关键数据加粗

### 城市选择 (pages/citychoose)
- 字母排序 A-Z 城市列表 + 输入搜索
- "猜你想找" 区域（热门城市 + 定位入口）
- 选中后 `events.emit('weatherRefresh', cityName)` 通知首页

### 设置 (pages/setting)
- 隐藏搜索栏开关
- 隐藏生活指数开关
- 屏幕常亮 / 更新提醒

### 系统信息 (pages/systeminfo)
- 设备型号/SDK版本/屏幕分辨率等

## 数据流

```
首页加载 → onLoad() → init()
         → getLocation()
         → api.lookupCity(坐标) → 拿到中文城市名
         → loadWeather(location, cityName)
         → Promise.all([getWeatherNow, getWeather24h, getWeather3d, getIndices])
         → parse*() 解析 → setData() 渲染

搜索 → commitSearch → api.lookupCity(val) → loadWeather(cityId, cityName)

下拉刷新 → onPullDownRefresh → init() → (同上)

城市选择 → events.emit('weatherRefresh', name) → onWeatherRefresh → search/init
```

## 关键逻辑模块

### services/weather.js
- `parseNowWeather(nowData, fxLink, cityName)` — 优先使用传入的中文城市名，坐标/ID时从 fxLink 提取拼音兜底
- `parseHourlyWeather(hourlyList)` — 解析24h预报
- `parseDailyForecast(dailyList)` — 解析3天预报 + `getDayLabel()` 生成"今天/明天/后天"
- `parseIndices(indicesList)` — 解析生活指数 + `lifestyleIconMap` 映射图标路径
- `getBackgroundByWeather(weatherText)` — 根据天气文字匹配背景图

### services/api.js
- `request(url, data)` — 通用 Promise 封装，校验 `code === '200'`
- `getWeatherNow` / `getWeather24h` / `getWeather3d` / `lookupCity` / `getIndices`

### pages/index/index.js 状态管理
- `data` — 页面状态对象（weatherNow, hourlyDatas, dailyForecast, lifeIndices 等）
- `_loading` — 下拉刷新防重入锁
- `_onWeatherRefresh` / `_onSettingChanged` — 事件总线回调（箭头函数绑定 this）

## 样式要点
- 全局背景 `#f4f6f9`，内容区使用背景图铺满
- 各数据模块背景使用半透明黑色 `rgba(0,0,0,.4~.6)` 叠加在背景图上
- 三个核心模块（逐时/3天/指数）各有独立的背景透明度和卡片风格
- 标题栏：26rpx 加粗 + 字间距 + 下划线分隔
- 详情网格：标签 22rpx 半透明白，数值 26rpx 加粗纯白

## 已知问题记录
- 选择城市后返回首页自动刷新（通过 `onWeatherRefresh` 事件，已修复 this 作用域）
