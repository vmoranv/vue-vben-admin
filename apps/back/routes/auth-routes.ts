import express from 'express';

import { verifyToken } from '../middleware/auth-middleware';
import { getUserInfo, login } from '../services/auth-service';

const router = express.Router();

// 登录
router.post('/login', login);

// 获取用户信息
router.get('/getUserInfo', verifyToken, getUserInfo);

export default router;
