import process from 'node:process';

import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

// 路由导入
import authRoutes from './routes/auth-routes';
import courseRoutes from './routes/course-routes';
import equipmentRoutes from './routes/equipment-routes';
import financialRoutes from './routes/financial-routes';
import memberRoutes from './routes/member-routes';
import staffRoutes from './routes/staff-routes';

// 加载环境变量
dotenv.config({ path: '.env.development.local' });

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.warn(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/staff', staffRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
    data: null,
  });
});

// 错误处理
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error('全局错误:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
    });
  },
);

// 启动服务器
app.listen(PORT, () => {
  console.warn(`服务器已启动, 正在监听端口 ${PORT}`);
});

export default app;
