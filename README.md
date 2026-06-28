# 本地媒体播放器 (Local Media Player)

这是一个基于纯前端（Serverless）架构的轻量级本地流媒体播放器，支持直接拖拽本地文件播放，同时支持无缝挂载并播放 **Google Drive** 中的音视频文件。

## 🌟 核心特性

- **纯静态架构**：无需任何后端服务器，可直接部署在 GitHub Pages 或本地运行。
- **Google Drive 深度集成**：支持通过 Google Picker 选择云盘文件或整个文件夹。
- **完美流式传输**：首创通过 Service Worker 拦截并代理 Google Drive 带有身份鉴权的媒体请求，完美支持大体积视频文件的拖拽进度条（Range Requests）。
- **隐私优先**：您的 Google Drive 凭证信息仅保存在浏览器的 `localStorage` 中。

---

## ☁️ Google Drive 配置指南

为了能够顺利播放您的 Google Drive 媒体，由于应用是纯前端架构，您需要在您个人的 Google Cloud Console 中申请一组 API 凭证，然后在播放器的设置中填入。

### 第一步：创建 Google Cloud 项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)。
2. 登录您的 Google 账号，点击顶部的项目选择器，点击 **New Project（新建项目）**。
3. 输入项目名称（例如 `local-player-drive`），然后点击 **Create（创建）**。

### 第二步：启用所需的 API
1. 在左侧导航栏中，依次点击 **APIs & Services（API 和服务）** -> **Library（库）**。
2. 搜索并启用以下两个 API：
   - **Google Drive API**
   - **Google Picker API**

### 第三步：配置 OAuth 同意屏幕 (OAuth Consent Screen)
1. 在左侧导航栏，点击 **OAuth consent screen（OAuth 同意屏幕）**。
2. User Type 选择 **External（外部）**，然后点击 **Create**。
3. 填写必要的信息：
   - App name（应用名称，如 `Local Player`）
   - User support email（您的邮箱）
   - Developer contact information（您的邮箱）
4. 其他步骤（Scopes 等）可以直接跳过或点击 Save and Continue。
5. **重要**：在最后的 Summary 页面，或者回到 Consent screen 页面，点击 **PUBLISH APP（发布应用）**。将其状态设为 "In production"，这样才不会有测试用户的限制。

### 第四步：获取 API 凭证
在左侧导航栏点击 **Credentials（凭据）**。

**1. 创建 API Key：**
- 点击顶部的 **+ CREATE CREDENTIALS（创建凭据）** -> **API key（API 密钥）**。
- 复制生成的 API Key（形如 `AIzaSy...`）。

**2. 创建 OAuth Client ID：**
- 再次点击 **+ CREATE CREDENTIALS（创建凭据）** -> **OAuth client ID（OAuth 客户端 ID）**。
- Application type 选择 **Web application（Web 应用）**。
- **Authorized JavaScript origins（已获授权的 JavaScript 来源）** 是极其重要的一步，您必须将您运行该播放器的确切 URL 添加进去（不能有末尾斜杠）。例如：
  - 如果您在本地测试运行，请添加：`http://localhost:8000`
  - 如果您部署在 GitHub Pages，请添加：`https://您的用户名.github.io`
- 点击 **Create**，然后复制生成的 **Client ID**（形如 `xxxx.apps.googleusercontent.com`）。

### 第五步：在播放器中填写配置
1. 打开您的媒体播放器网页。
2. 在右侧“播放列表”上方，点击 **⚙️ 设置** 按钮。
3. 将刚才获取的 **Client ID** 和 **API Key** 粘贴到对应的输入框中。
4. 点击 **保存**。
5. 现在您可以点击播放器左侧的 **“从 Google Drive 导入”**，尽情享受云盘播放体验了！

---

## 🚀 本地运行开发环境

由于调用 Google Identity Services 和 Service Worker 存在安全限制，**不可直接通过双击 `index.html` (file:// 协议) 运行**，请务必使用本地 HTTP 服务器。

如果您安装了 Python，可以在项目根目录下执行：
```bash
python3 -m http.server 8000
```
然后在浏览器中访问 `http://localhost:8000` 即可。
