# LongRoot MVP

后端优先的 LongRoot MVP，包含登录、项目 CRUD、Binance 行情抓取、MACD 计算骨架、定时任务与健康检查。

## 目录

- `backend/` Express + MySQL 后端
- `backend/sql/001_init.sql` 数据库 schema
- `frontend/` 前端占位目录（本次未实现页面）
- `docs/STATUS.md` 当前状态说明

## 已实现

- Express 项目骨架
- `.env.example` 基础配置
- MySQL schema 初始化脚本
- 管理员种子账号方案
- 登录接口 `POST /api/auth/login`
- 项目 CRUD 接口 `GET/POST/PUT/DELETE /api/projects`
- Binance K 线抓取 + MACD 计算模块骨架
- 手动/定时市场同步接口
- 健康检查 `GET /api/health`

## 快速开始

### 1. 安装依赖

```bash
cd /home/zzzgggwww/openclaw-work/longroot-app/backend
cp .env.example .env
npm install
```

### 2. 初始化数据库

```bash
npm run db:init
npm run seed:admin
```

### 3. 启动服务

```bash
npm run dev
# 或
npm start
```

默认监听：`http://127.0.0.1:3000`

## 默认管理员账号

从 `.env` 读取：

- 用户名：`ADMIN_SEED_USERNAME`，默认 `admin`
- 密码：`ADMIN_SEED_PASSWORD`，默认 `Admin123456`

> 服务启动时也会自动确保管理员账号存在。

## API 示例

### 健康检查

```bash
curl http://127.0.0.1:3000/api/health
```

### 创建管理员 token

```bash
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin123456"}'
```

### 创建项目

```bash
TOKEN=替换成登录返回的token
curl -X POST http://127.0.0.1:3000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "symbol":"BTCUSDT",
    "period":"H",
    "buyAmountPerOrder":100,
    "takeProfitMultiple":2,
    "sellDivisor":4,
    "status":1
  }'
```

### 手动触发市场同步

```bash
curl -X POST http://127.0.0.1:3000/api/market/sync \
  -H "Authorization: Bearer $TOKEN"
```

## 当前限制

- 前端页面尚未实现，仅保留目录
- 用户管理/改密未实现
- 信号规则是 PRD 对应的 MVP 近似实现，仍可继续校准 Excel 细节
- 未接入 PM2 / Docker / 单元测试
