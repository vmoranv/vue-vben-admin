import express from 'express';

import { verifyToken } from '../middleware/auth-middleware';
import { getAccessCodes, getUserInfo, login } from '../services/auth-service';

const router = express.Router();

// 登录
router.post('/login', login);

// 获取用户信息
router.get('/user/info', verifyToken, getUserInfo);

// 获取访问码
router.get('/codes', verifyToken, getAccessCodes);

export default router;
