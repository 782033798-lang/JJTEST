# JJTEST - Web 在线聊天工具

一个基于 Vue 3 + Node.js + Socket.IO 的实时 Web 聊天应用。

## 功能

- 实时文字消息发送与接收
- 图片上传与预览（点击大图查看）
- 文件上传与下载（支持所有格式，最大 50MB）
- 聊天历史记录查看（分页加载）
- 在线用户列表
- 输入状态提示
- 响应式设计，支持移动端

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite |
| 后端 | Node.js + Express + Socket.IO |
| 数据库 | SQLite (better-sqlite3) |
| 文件存储 | 本地磁盘 |
| 通信 | WebSocket (Socket.IO) |

## 快速开始

### 安装依赖

```bash
npm install
npm run install:all
```

### 开发模式

```bash
npm run dev
```

前端开发服务器运行在 http://localhost:5173 ，后端 API 运行在 http://localhost:3000 。

### 生产部署

```bash
# 构建前端
npm run build

# 启动服务
npm start
```

服务器会同时提供 API 和前端静态文件，访问 http://localhost:3000 即可。

## 项目结构

```
JJTEST/
├── client/               # Vue 3 前端
│   ├── src/
│   │   ├── App.vue
│   │   ├── components/
│   │   │   ├── LoginPanel.vue    # 登录页
│   │   │   └── ChatRoom.vue      # 聊天室主界面
│   │   ├── main.js
│   │   └── style.css
│   ├── vite.config.js
│   └── package.json
├── server/               # Node.js 后端
│   ├── index.js          # 服务器入口
│   ├── uploads/          # 文件存储目录
│   └── package.json
├── index.html            # 原始首页
├── package.json          # 根项目配置
└── README.md
```
