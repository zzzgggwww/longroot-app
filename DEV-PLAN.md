# LongRoot MVP 开发计划

## 已确认
- 前端：Vue 3 + Element Plus
- 后端：Node.js + Express
- 数据库：MySQL
- 周期：H / D / W
- 数据源：Binance 公共 API
- 部署：本机本地部署，无 HTTPS
- 项目目录：`/home/zzzgggwww/openclaw-work/longroot-app`

## MVP 范围
1. 登录页
2. 项目管理（支持自定义 symbol，默认 BTC/ETH）
3. 数据采集任务
4. MACD 计算（DIF/DEA）
5. 信号判断（BUY/SELL/HOLD）
6. 项目列表/详情展示
7. 本地部署跑通

## Excel 规则初步结论
从 `BTC周` / `BTC日` 可见：
- 买入核心：当前 DIF 是最近 3 个周期最大值
- 卖出核心：当前 DEA 小于最近 3 个周期 DEA 最大值
- 限红逻辑：当持仓市值超过阈值时，再出现买入型 DIF 峰值触发限红卖出
- Excel 还混入了价格涨跌倍数（1/2）、卖出比例缩放等历史试算列

## 程序实现建议
为了和 PRD 一致、避免直接照搬 Excel 的冗余表格列：
- 指标计算以 Binance K 线 + 标准 MACD 为准
- 规则判断按 PRD 主规则实现
- 保留一层 `strategy_reason` 文本，记录每次信号为什么出现
- 后续如果要 100% 拟合 Excel，再加“Excel兼容模式”

## 币种设计
- 表单允许用户输入 symbol，例如 `BTCUSDT` / `ETHUSDT`
- 同时提供常用下拉候选（BTCUSDT, ETHUSDT）
- 后续可加 Binance 交易对拉取接口

## 待安装/初始化
- Node.js/npm（若版本不合适则升级）
- MySQL Server（若未安装）
- 项目依赖（express/vue/prisma/element-plus/node-cron/jwt 等）
- PM2（本地常驻运行建议）

## 下一步
1. 检查本机 Node / npm / MySQL 现状
2. 列出一次性提权安装命令
3. 初始化前后端项目骨架
4. 建数据库与采集任务
