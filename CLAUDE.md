# 寻鲸 — 项目文档

## 项目概述
校园LBS+数字藏品App "寻鲸"。RN(Expo SDK 56)+Node.js/Express/MongoDB/Redis。
- 包名: `com.wangyixang.campus` | Web: `https://seekwhale.cn` | API: `124.222.230.80:3000`
- GitHub: `https://github.com/9ykrz5wssj-oss/xunjing`（公开，SSH: `git@github.com:9ykrz5wssj-oss/xunjing.git`）
- 本地SSH密钥: `~/.ssh/id_rsa`（GitHub和服务器共用）

## 路径
| 用途 | 路径 |
|------|------|
| 源码 | `C:\Users\21198\Desktop\初稿\` |
| APK构建 | `C:\Users\21198\Desktop\campus-app\`（独立副本，需同步源码后构建） |
| 桌面APK | `C:\Users\21198\Desktop\app-release.apk` |

## 服务器
| 项目 | 值 |
|------|------|
| SSH | `ssh ubuntu@124.222.230.80`（密钥登录） |
| sudo密码 | 见本机 `client/temp_pass.txt` |
| PM2 | `pm2 restart campus` |
| 服务端运行方式 | `tsx src/index.ts`（直接执行TS，无需编译） |
| 网站目录 | `/var/www/seekwhale/`（nginx直出） |
| API | `http://124.222.230.80:3000`（Express） |

## 平台文件规则
- `MapScreen.tsx` — Web (Leaflet) | `MapScreen.native.tsx` — 手机 (WebView)
- `MapPickerScreen.tsx` — Web | `MapPickerScreen.native.tsx` — 手机
- `.native.tsx` **优先级最高**，Web构建**必须**移除（临时改名 `_M.bak`，构建完恢复）
- 不要改导航框架（native-stack/detachInactiveScreens/animationEnabled 都会导致白屏或卡死）

---

## 三端部署流程（Git Bash下执行）

### 1. 服务端
```bash
scp "c:/Users/21198/Desktop/初稿/server/src/index.ts" ubuntu@124.222.230.80:/home/ubuntu/server/src/
# 如果有其他文件改动：
scp -r "c:/Users/21198/Desktop/初稿/server/src/"* ubuntu@124.222.230.80:/home/ubuntu/server/src/
ssh ubuntu@124.222.230.80 "pm2 restart campus"
# 验证
curl http://124.222.230.80:3000/api/health
```

### 2. Web
```bash
# 移除.native.tsx
cd "c:/Users/21198/Desktop/初稿/client/src/screens/map" && mv MapScreen.native.tsx _M.bak
cd "c:/Users/21198/Desktop/初稿/client/src/screens/publish" && mv MapPickerScreen.native.tsx _P.bak

# 构建
cd "c:/Users/21198/Desktop/初稿/client" && rm -rf dist && npx expo export --platform web

# 部署
cd "c:/Users/21198/Desktop/初稿/client"
cp assets/icon.png dist/favicon.ico
ssh ubuntu@124.222.230.80 "sudo rm -rf /var/www/seekwhale /tmp/seekwhale-web; sudo mkdir -p /var/www/seekwhale"
scp -r dist/* ubuntu@124.222.230.80:/tmp/seekwhale-web/
ssh ubuntu@124.222.230.80 "sudo cp -r /tmp/seekwhale-web/* /var/www/seekwhale/; sudo chmod -R 755 /var/www/seekwhale"

# ⚠️ 必须：恢复APK下载文件（Web部署会清空目录）
scp "C:/Users/21198/Desktop/app-release.apk" ubuntu@124.222.230.80:/tmp/
ssh ubuntu@124.222.230.80 "sudo cp /tmp/app-release.apk /var/www/seekwhale/ && sudo chmod 644 /var/www/seekwhale/app-release.apk"

# 恢复.native.tsx
cd "c:/Users/21198/Desktop/初稿/client/src/screens/map" && mv _M.bak MapScreen.native.tsx
cd "c:/Users/21198/Desktop/初稿/client/src/screens/publish" && mv _P.bak MapPickerScreen.native.tsx
```

### 3. APK
```bash
# 同步源码到campus-app
cp -r "c:/Users/21198/Desktop/初稿/client/src/"* "C:/Users/21198/Desktop/campus-app/client/src/"
cp "c:/Users/21198/Desktop/初稿/client/App.tsx" "c:/Users/21198/Desktop/初稿/client/app.json" "c:/Users/21198/Desktop/初稿/client/package.json" "c:/Users/21198/Desktop/初稿/client/tsconfig.json" "C:/Users/21198/Desktop/初稿/client/index.ts" "C:/Users/21198/Desktop/初稿/client/index.web.ts" "C:/Users/21198/Desktop/campus-app/client/"

# 构建
cd "C:/Users/21198/Desktop/campus-app/client/android"
export JAVA_HOME="C:/jdk-17.0.15+6"
export ANDROID_HOME="C:/Android"
export GRADLE_OPTS="-Dfile.encoding=UTF-8"
./gradlew.bat assembleRelease

# 输出
cp "C:/Users/21198/Desktop/campus-app/client/android/app/build/outputs/apk/release/app-release.apk" "C:/Users/21198/Desktop/app-release.apk"

# 可选：ADB安装到手机（需USB连接）
export PATH="$PATH:/c/Android/platform-tools"
adb install -r "C:/Users/21198/Desktop/app-release.apk"
```

---

## 🔴 GPS定位架构（绝对不要乱改！！！）

### 两套独立代码
| 端 | 文件 | 定位方式 |
|------|------|------|
| Web | `MapScreen.tsx` | `navigator.geolocation.watchPosition({enableHighAccuracy:true})` + WGS84→GCJ02 |
| App | `MapScreen.native.tsx` | AMap原生(GCJ02直接) → expo-location兜底(WGS84→GCJ02) |

**两个文件互不影响，不要交叉修改。**

### App定位链
```
AMapLocationModule (Java→高德SDK→GCJ02，无需坐标转换)
  ↓ 失败
expo-location (requestPermissions→getCurrentPosition→WGS84转GCJ02)
  ↓ 失败
显示错误，不跳IP兜底
```

### AMap SDK隐私合规（致命！）
AMap SDK 6.4.7+ 强制在 `new AMapLocationClient()` 前调用：
```java
AMapLocationClient.updatePrivacyShow(context, true, true);
AMapLocationClient.updatePrivacyAgree(context, true);
```
不加这两行→SDK静默罢工，不报错不崩溃不回调。Java源码在 `campus-app/.../AMapLocationModule.java`。

文件 `campus-app/client/android/app/build.gradle` 里AMap版本固定为 `6.4.7`，不能用 `latest.integration`。

### 绝对禁止
- **不要调用IP定位兜底**——服务器在北京，地图会跳到北京
- **不要在WebView HTML里用`navigator.geolocation`**——非HTTPS页面系统拒绝
- **不要用缓存位置做地图初始中心**——旧错误坐标污染新会话
- **不要修改MapScreen.tsx的GPS**——网页版和App版逻辑独立

### ADB调试GPS
```bash
export PATH="$PATH:/c/Android/platform-tools"
adb devices                         # 确认手机连接
adb install -r <apk路径>             # 装APK
adb logcat -c                       # 清日志
adb shell am start -n com.wangyixang.campus/.MainActivity
adb logcat -s ReactNativeJS:I       # JS日志
adb logcat -d | grep -i amap        # AMap SDK日志
adb shell am force-stop com.wangyixang.campus  # 强制停止
```

---

## 🔔 版本更新机制

### 原理
- `server/src/index.ts` 声明 `APP_VERSION`，对外暴露 `/api/version`
- `client/App.tsx` 声明 `LOCAL_VERSION`，App启动时fetch比对
- **仅App端弹窗**（`Platform.OS !== "web"`），网页刷新即最新，不弹
- 弹窗下载链接：`https://seekwhale.cn/app-release.apk`

### 触发更新
1. 改 `server/src/index.ts` → `APP_VERSION`（如 `1.0.5` → `1.0.6`）
2. 部署服务端
3. 同步 `client/App.tsx` → `LOCAL_VERSION` 和 `client/app.json` → `version`（保持三处一致）
4. 重新构建APK并上传到服务器

### 版本检查用 `fetch("http://124.222.230.80:3000/api/version")` 
- ❌ 不能用 `api.get("/version")`：会自动加 `/api/v1` 前缀→404
- ❌ 不能用 `https://seekwhale.cn/api/version`：RN环境HTTPS可能连接重置
- ✅ **必须用 HTTP直连**

---

## 📦 APK下载

- APK ~83MB，服务器带宽 ~350KB/s（3Mbps），下载约4分钟
- nginx直接serve：`/var/www/seekwhale/app-release.apk`
- **每次Web部署会清空 `/var/www/seekwhale/`，必须重新上传APK**

### 免费CDN方案全部失败
腾讯云COS、蓝奏云、123云盘、Gitee、CloudFlare R2、七牛云——均因APK拦截/大小限制/付费等原因失败。

### 长期方案
1. 升级VPS带宽（腾讯云控制台，3→10Mbps，几块钱/月）
2. 备案域名后挂COS自定义域名+CDN（终极方案，不限速）

---

## 网页端已修复问题
- Alert三按钮→polyfill为window.confirm
- 标题MutationObserver锁死"寻鲸"
- react-dom 19.2.3匹配react
- Leaflet动态加载+invalidateSize()
- 图片/favicon路径

## 特殊账号
- **小妖** userId=5201314，管理员。验证码登录邮箱框输入"小妖"→直接登录。开箱无冷却。

## 关键教训
1. `.native.tsx`优先级最高，Web构建必移除
2. **编辑JSX严禁用sed/行号删除**，必须用Edit工具精确文本替换
3. `replace_all`前必须确认替换后语法完整性
4. 新增任何API字段必须同步更新Zod schema
5. **部署后必须curl验证API可用性**
6. 不改导航框架
7. Campus-app是独立副本，不是软链接
8. 每次Web部署后必须重新上传APK到服务器
