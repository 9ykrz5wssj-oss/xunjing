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
- 教程弹窗（仅验证码登录后）

## 踩过的坑（关键）
1. .native.tsx优先级最高，Web构建必移除
2. 不改导航框架
3. Alert.alert三参数Web不支持→polyfill
4. /tmp堆积旧JS→每次部署前清空
5. Campus-app是独立副本非junction
6. 中文路径NDK不支持
7. 自适应图标删除mipmap-anydpi-v26
