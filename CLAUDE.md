# 寻鲸 — 项目文档

## 项目概述
校园LBS+数字藏品App "寻鲸"。RN(Expo SDK 56)+Node.js/Express/MongoDB/Redis。
- APK: `com.wangyixang.campus` | Web: `https://seekwhale.cn` | API: `124.222.230.80:3000`

## 路径
| 用途 | 路径 |
|------|------|
| 源码 | `C:\Users\21198\Desktop\初稿\` |
| APK构建 | `C:\Users\21198\Desktop\campus-app\` (独立副本) |
| Web构建 | `C:\Users\21198\Desktop\初稿\client\` |
| 桌面APK | `C:\Users\21198\Desktop\app-release.apk` |

## 每次更新：三端部署流程
```powershell
# === 1. 服务端 ===
scp server\src\... ubuntu@124.222.230.80:/home/ubuntu/server/src/...
ssh ubuntu@124.222.230.80 "pm2 restart campus"

# === 2. Web (先移除.native.tsx) ===
cd C:\Users\21198\Desktop\初稿\client\src\screens\map; ren MapScreen.native.tsx _M.bak
cd ..\publish; ren MapPickerScreen.native.tsx _P.bak
cd C:\Users\21198\Desktop\初稿\client; rmdir /s /q dist; npx expo export --platform web
copy C:\Users\21198\Desktop\icon.png dist\favicon.ico
ssh ubuntu@124.222.230.80 "sudo rm -rf /var/www/seekwhale /tmp/seekwhale-web; sudo mkdir -p /var/www/seekwhale"
scp -r dist\* ubuntu@124.222.230.80:/tmp/seekwhale-web/
ssh ubuntu@124.222.230.80 "sudo cp -r /tmp/seekwhale-web/* /var/www/seekwhale/; sudo chmod -R 755 /var/www/seekwhale"
# 恢复.native
ren _M.bak MapScreen.native.tsx; ren _P.bak MapPickerScreen.native.tsx

# === 3. APK ===
# 同步到campus-app: copy源文件到campus-app对应路径
cd C:\Users\21198\Desktop\campus-app\client\android
$env:JAVA_HOME="C:\jdk-17.0.15+6"; $env:ANDROID_HOME="C:\Android"; $env:GRADLE_OPTS="-Dfile.encoding=UTF-8"
.\gradlew.bat assembleRelease
adb install -r app\build\outputs\apk\release\app-release.apk
copy app\build\outputs\apk\release\app-release.apk C:\Users\21198\Desktop\app-release.apk

# === 4. CLAUDE.md === 更新本文档
```

## 平台文件
- `MapScreen.tsx` — Web (Leaflet) | `MapScreen.native.tsx` — 手机 (WebView)
- `MapPickerScreen.tsx` — Web (Leaflet) | `MapPickerScreen.native.tsx` — 手机 (WebView)
- `.native.tsx`优先级>.tsx，Web构建必须移除

## 网页版已修复
- API/Socket: Web用相对路径
- 图片: `https://seekwhale.cn/uploads/...`
- Leaflet: 动态加载JS+CSS，`invalidateSize()`
- 标题: MutationObserver锁死"寻鲸"
- favicon: 桌面icon.png替换
- Alert多按钮: index.ts入口polyfill → window.confirm
- react-dom版本匹配react(19.2.3)
- 文件权限: /home/ubuntu和/home/ubuntu/server → 755

## 网页版已知限制
- Stack内偶发按钮无响应（RN+RNW兼容问题，大部分已通过Alert polyfill修复）
- 停止修改导航结构（native-stack/detachInactiveScreens/animationEnabled都会导致白屏或卡死）

## 临时会话清理
- 活动结束后24小时：群聊自动关闭，所有消息从 MongoDB 删除，Redis 群聊成员集合清空
- `EVENT_CONFIG.GROUP_CHAT_READONLY_AFTER_HOURS: 24`
- 每分钟 cron 检查：状态转换 + 消息清理

## 特殊账号
- **小妖**: userId=5201314, 管理员, 昵称"小妖"
- 登录方式: 验证码登录邮箱框输入"小妖" → 直接登录
- 开箱无冷却, 可管理后台

## 特殊功能
- 「小妖」快捷登录: `POST /auth/dev-login {userId:5201314}`
- 管理员开箱无冷却
- 管理员1人高级宝箱
- 每5分钟宝箱补充
- 爆率调整: 管理员后台可调两种宝箱各稀有度爆率，DropConfig模型持久化
- 教程弹窗（仅验证码登录后）
- 管理员1人高级宝箱
- 每5分钟宝箱补充
- 教程弹窗（仅验证码登录后）

## 踩过的坑（关键）
1. .native.tsx优先级最高，Web构建必移除
2. 不改导航框架
3. Alert.alert三参数Web不支持→polyfill
4. /tmp堆积旧JS→每次部署前清空
5. Campus-app是独立副本非junction
6. 中文路径NDK不支持
7. 自适应图标删除mipmap-anydpi-v26

## 🔴 GPS定位架构（每任Claude必读！！！）

### 两套代码，两套定位策略

| 端 | 文件 | 定位方式 | 坐标系 |
|------|------|------|------|
| Web | `MapScreen.tsx` | `navigator.geolocation.watchPosition({enableHighAccuracy:true})` | WGS84→GCJ02转换 |
| App | `MapScreen.native.tsx` | AMap原生模块(GCJ02直接) → expo-location兜底(WGS84→GCJ02) | 高德地图用GCJ02 |

### App定位调用链
```
AMapLocationModule (原生Java→高德SDK→GCJ02,无需转换)
  ↓ 失败或不存在
expo-location (requestPermissions→getCurrentPosition→WGS84转GCJ02)
  ↓ 失败
显示错误提示，不跳IP兜底
```

### 致命教训：AMap SDK隐私合规（2026.06.16，耗费4小时+）

**问题**：App定位一直失败，logcat显示：
```
AMapLocationClient: 确保调用SDK任何接口前先调用updatePrivacyShow、updatePrivacyAgree
```

**根因**：AMap SDK 6.4.7+ 强制要求在创建`AMapLocationClient`之前调用两个隐私合规接口，否则SDK静默拒绝工作（不报错、不崩溃、不回调）。

**修复** `campus-app/.../AMapLocationModule.java` 的 `start()` 方法，在 `new AMapLocationClient()` 之前加：
```java
AMapLocationClient.updatePrivacyShow(context, true, true);
AMapLocationClient.updatePrivacyAgree(context, true);
```

**教训**：
- `latest.integration` 会导致SDK版本不可控，用固定版本`6.4.7`
- AMap SDK静默失败时检查：①隐私合规 ②AndroidManifest API key ③libapssdk.so是否打包
- 调试GPS必须连ADB：`adb logcat -s ReactNativeJS:I` 看JS日志，`grep -i amap` 看SDK日志

### ADB调试GPS的完整流程
```bash
# 必须是bash（Git Bash），PowerShell不支持
export PATH="$PATH:/c/Android/platform-tools"
adb devices                          # 确认设备连接
adb install -r <apk路径>             # 安装APK
adb logcat -c                        # 清日志
adb shell am start -n com.wangyixang.campus/.MainActivity  # 启动App
timeout 20 adb logcat -s ReactNativeJS:I  # 抓JS日志
adb logcat -d | grep -i amap         # 抓AMap SDK日志
```

### 不要做的事（血的教训）
- **不要在任何地方调用IP定位兜底**——服务器在北京，会把地图拉到北京
- **不要在WebView HTML里用navigator.geolocation**——非HTTPS页面被系统拒绝
- **不要缓存用户位置作为地图初始中心**——旧错误位置会污染新会话
- **不要改MapScreen.tsx的GPS**——网页版有自己的逻辑，互不影响

## 🔔 版本更新机制

### 工作原理
- 服务端 `server/src/index.ts` → `APP_VERSION` → `/api/version` 接口
- App端 `client/App.tsx` → `LOCAL_VERSION` → 启动时 fetch `/api/version`
- 服务端版本 > 本地版本 → 弹窗"发现新版本"→ 下载 `https://seekwhale.cn/app-release.apk`

### 触发更新步骤
只需改一处：`server/src/index.ts` 的 `APP_VERSION`（如 `1.0.1` → `1.0.2`），部署服务端即可。
之后同步 `client/App.tsx` 的 `LOCAL_VERSION` 和 `client/app.json` 的 `version`。

### 踩坑：fetch URL
- **不能用 `api.get("/version")`**：api服务会自动加 `/api/v1` 前缀变成 `/api/v1/version`（404）
- **不能用 `https://seekwhale.cn/api/version`**：RN环境fetch对HTTPS可能抛 `SocketException: Connection reset`
- **必须用 `http://124.222.230.80:3000/api/version`**：HTTP直连最稳定

## 📦 APK下载与分发（血的教训）

### 现状
- APK大小：~83MB（含所有ABI）
- 服务器带宽：~350KB/s（腾讯云轻量 3Mbps）
- 下载耗时：约4分钟
- 下载方式：nginx直出 `/var/www/seekwhale/app-release.apk`（sendfile零拷贝）
- 弹窗/网页下载按钮均指向 `https://seekwhale.cn/app-release.apk`

### 试过的免费方案（全失败）
| 方案 | 失败原因 |
|------|------|
| 腾讯云COS默认域名 | 检测文件内容，APK无论改什么后缀都被拦 |
| 蓝奏云 | 拦APK上传 |
| 123云盘 | 分享页手机端打不开 |
| Gitee仓库 | 单文件限制50MB，APK 83MB超限 |
| CloudFlare R2 | 需付费订阅 |
| 七牛云 | 测试域名明确禁止APK下载 |

### COS方案（需备案域名）
腾讯云COS+自定义域名完美解决，但需ICP备案。seekwhale.cn目前未备案。

### 后续优化方向
1. 升级VPS带宽：腾讯云控制台3Mbps→10Mbps（几块钱/月），4分钟→1分钟
2. 备案域名+COS CDN：不限速，终极方案
3. 分架构编译：只打arm64-v8a，APK~45MB，时间减半
4. CloudFlare R2：免费10GB+不限下载，需测试中国访问速度

### 每次Web部署后必做
```bash
scp "C:/Users/21198/Desktop/app-release.apk" ubuntu@124.222.230.80:/tmp/
ssh ubuntu@124.222.230.80 "sudo cp /tmp/app-release.apk /var/www/seekwhale/ && sudo chmod 644 /var/www/seekwhale/app-release.apk"
```

## 🔴 本次会话中的严重失误

### 1. JSX布局反复失败
AdminPanelScreen.tsx的冷却时间设置区域，从原位置移到独立位置的过程：
- 反复使用sed/python删除和插入，每次都破坏JSX闭合标签结构
- 最终方案：两步Edit精确替换——先在目标位置插入新CD块，再删除旧CD块+修复保存按钮
- **教训：编辑JSX时严禁用sed行号删除，必须用Edit工具做精确文本替换**

### 2. 服务器崩溃（761次重启）
chest.handler.ts中`replace_all`把三元表达式改成不完整语法：
```typescript
// 错误的：chest.type === NORMAL ? await getCooldownSeconds(chest.type);
// 正确的：await getCooldownSeconds(chest.type)
```
- **教训：`replace_all`前必须确认替换后的语法完整性**

### 3. Zod校验丢字段（两次）
title字段和studentId字段都被Zod schema默认strip掉：
- **教训：新增任何API字段必须同步更新Zod schema**

### 4. 数据恐慌
服务器崩溃导致前端空白，用户以为数据全丢。实际数据完好，只是API不可用。
- **教训：部署后必须验证API可用性（curl测试）**
