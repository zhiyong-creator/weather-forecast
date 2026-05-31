WeatherWidget 简易天气查询小程序 —— 项目功能介绍
一、项目概述
# WeatherWidget 简易天气查询小程序

## 项目配置信息 (新会话必读)

### 和风天气 API 配置
- **API Key**: `9cad8bce59904f4699ac9f275db3e091`
- **API Host (专属域名)**: `pv6apvmwqk.re.qweatherapi.com`
- **开发者 ID**: `Q175780772`
- **API 版本**: v7
- **接口地址**:
  - 实时天气: `https://pv6apvmwqk.re.qweatherapi.com/v7/weather/now`
  - 24小时预报: `https://pv6apvmwqk.re.qweatherapi.com/v7/weather/24h`
  - 3天预报: `https://pv6apvmwqk.re.qweatherapi.com/v7/weather/3d`
  - 城市查询(GeoAPI): `https://pv6apvmwqk.re.qweatherapi.com/geo/v2/city/lookup`
- **定位**: 使用 LocationID (如北京=`101010100`)，不直接使用城市名
- **微信开发者工具**: 需勾选「不校验合法域名」

### 项目架构 (重构后)
```
app.js                        # 全局配置 + 设备信息 (getWindowInfo/getDeviceInfo)
services/api.js               # API 服务层，封装所有和风天气 HTTP 请求 (返回 Promise)
services/weather.js           # 数据解析 + 背景图匹配 (查找表)
utils/events.js               # 轻量事件总线 (替代 getCurrentPages hack)
utils/utils.js                # 工具函数 (formatDate, isEmptyObject, cmpVersion)
data/staticData.js            # 城市列表 + 热门城市 (hotCities)
pages/index/index.js          # 首页 (~290行)，使用 loadWeather() 统一加载
pages/index/index.wxml        # 首页模板，字段名为 v7 格式 (temp/feelsLike/text/windDir)
pages/citychoose/citychoose.js # 城市选择，通过 events.emit('weatherRefresh') 通知首页
pages/setting/setting.js      # 设置页，通过 events.emit('settingChanged') 通知首页
pages/about/about.js          # 关于页
pages/systeminfo/systeminfo.js # 系统信息页
components/heartbeat/         # 爱心动画组件 (搜索520/521触发)
```

### 当前已知问题 (待修复)
1. **右下角菜单按钮问题**: 点击主菜单按钮后弹出分享对话框而非展开菜单。
   - **原因**: `.share` 元素内的 `<button open-type='share'>` (透明覆盖层) 与主菜单按钮位于同一初始位置 (`bottom:150rpx; right:70rpx`)，即使 opacity 为 0 也拦截了点击事件。
   - **修复方向**: 已将主按钮 `.menus .main` z-index 提升到 103 (高于子按钮 102)。如仍有问题，可尝试给 `.menus .share button` 添加 `pointer-events: none` 并在菜单展开时恢复。
   - **相关文件**: `pages/index/index.wxml` (菜单 share 结构)、`pages/index/index.wxss` (`.menus` 样式)

### 重构记录
- 云开发代码已彻底删除 (cloudfunction/ 目录、所有注释代码)
- `wx.getSystemInfo` 已替换为 `wx.getWindowInfo()` + `wx.getDeviceInfo()`
- `open-data` 组件已替换为天气图标 + 更新时间
- WXML 字段名全部使用 v7 格式 (temp/feelsLike/text/windDir 等)
- 跨页面通信使用 events.js 事件总线
- 背景图手动切换功能已修复 (setBcgImg 方法已补全)
- 3 天预报已添加 (API + WXML)

---

## 一、项目概述
本项目是一款基于微信小程序原生框架开发的轻量天气查询工具，无需微信云开发，全部气象数据通过和风天气开放 API获取；依靠微信原生定位接口、网络请求接口完成数据拉取与页面渲染，界面简洁轻量化，开箱即用，适合日常快速查看气象信息，同时也是学习微信小程序网络请求、定位授权、全局变量管理的实战项目。

小程序首页

![777777777mage](E:\图片\picture_Cache\777777777mage.jpeg)

预报页面

![77image](E:\图片\picture_Cache\77image.jpeg)

二、核心业务功能

1. 自动定位，一键查询本地天气
   打开小程序自动申请地理位置权限，调用微信wx.getLocation获取当前经纬度；
     经纬度自动传入和风天气 API，无需手动输入城市，自动加载当前城市实时气象；
     权限拒绝时弹窗提示用户开启定位，保障基础使用。
2. 实时气象信息展示
   首页核心区域直观展示当下完整实况天气：
     当前实时温度、体感温度；
     天气状况（晴 / 多云 / 小雨 / 雪等文字 + 配套天气图标）；
     详细气象参数：空气湿度、风向、风力等级、能见度；
     城市名称、区域定位信息。
3. 24 小时逐小时天气预报
   横向滚动卡片展示未来一整天每小时天气变化，可滑动查看早晚温差、降雨时段，提前规划出行。
4. 多日天气预报（3 天 / 7 天）
   和风免费 Key 默认支持 3 天预报，完成个人开发者认证后可获取 7 天完整预报；
     展示每日最高温、最低温、白天 / 夜间天气状况，搭配天气图标直观区分。
5. 下拉刷新实时更新气象
   首页支持下拉手势刷新，重新调用和风 API 拉取最新天气数据，无需重启小程序即可更新气象信息。
6. 屏幕常亮设置
   内置保持屏幕常亮开关，开启后小程序前台运行时手机不会自动熄屏，适合长时间查看天气。
     三、配套辅助功能
     设备适配
     自动识别 iPhone X 及以上带刘海机型，自动调整页面顶部边距，解决刘海遮挡界面问题，兼容绝大多数安卓、苹果手机。
     无云开发轻量化运行
     项目内置云开发兼容代码，可一键注释云初始化代码，完全脱离微信云服务运行，降低部署门槛，新手无需开通云开发即可调试。
     全局统一接口管理
     所有和风天气 API 地址、密钥统一存放于app.js全局变量，一处修改全局生效，便于更换和风 Key、调整接口地址，维护简单。
     友好调试适配
     支持开发者工具「不校验合法域名」模式，本地调试无需提前在小程序后台配置域名白名单，降低本地测试成本。
     四、技术实现亮点（可选，用于课程作业）
     采用微信原生 WXML+WXSS+JavaScript 开发，无第三方 UI 框架，代码体积小、加载速度快；
     全局状态管理：通过globalData统一存储和风密钥、设备信息、接口地址；
     模块化网络请求：统一封装和风 API 调用逻辑，减少重复代码；
     设备信息自动获取：页面启动自动读取手机系统信息，做屏幕适配；
     接口解耦：天气、小时预报接口地址分离，后期可单独替换 / 新增气象接口。





剩余截图

<div >
    <img src='https://gitee.com/lwzhang1101/images/raw/master/img/weather3.png' style='style='max-width:100px!important;width:100px!important;'>
    <img src='https://gitee.com/lwzhang1101/images/raw/master/img/weather4.png' style='style='max-width:100px!important;width:100px!important;'>
</div>


