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
