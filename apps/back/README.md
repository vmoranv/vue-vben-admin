# 健身房会员与设备管理系统后端

## 项目介绍

健身房会员与设备管理系统后端，提供会员管理、设备维护、课程管理、财务管理等功能的API接口。

## 技术栈

- Node.js
- Express
- TypeScript
- PostgreSQL
- JWT认证

## 项目设置

### 安装依赖

```bash
pnpm install
```

### 环境变量配置

复制示例环境变量文件并修改为你的配置：

```bash
cp .env.development.example .env.development.local
```

修改 `.env.development.local` 文件中的配置，特别是数据库连接信息。

### 初始化数据库

```bash
chmod +x ./init-db.sh
./init-db.sh
```

## 运行项目

### 开发环境

```bash
pnpm dev
```

### 生产环境

```bash
pnpm build
pnpm start
```

## API文档

### 认证API

- POST /api/auth/login - 用户登录
- GET /api/auth/getUserInfo - 获取当前用户信息

### 会员管理API

- GET /api/members/list - 获取会员列表
- POST /api/members - 添加会员
- PUT /api/members/:id - 更新会员信息
- GET /api/members/:id - 获取会员详情
- POST /api/members/checkIn - 会员签到

### 设备管理API

- GET /api/modules/equipment/list - 获取设备列表
- POST /api/modules/equipment - 添加设备
- PUT /api/modules/equipment/:id/status - 更新设备状态
- POST /api/modules/equipment/maintenance - 添加设备维护记录
- GET /api/modules/equipment/maintenance/:equipment_id - 获取设备维护记录

### 课程管理API

- GET /api/modules/courses/list - 获取课程列表
- POST /api/modules/courses - 添加课程
- PUT /api/modules/courses/:id - 更新课程信息
- PUT /api/modules/courses/:id/cancel - 取消课程
- POST /api/modules/courses/book - 预约课程
- POST /api/modules/courses/cancel-booking - 取消预约
- GET /api/modules/courses/coach-stats - 获取教练课程统计

### 财务管理API

- GET /api/modules/financial/list - 获取财务记录列表
- POST /api/modules/financial - 添加财务记录
- GET /api/modules/financial/statistics - 获取财务统计
