import express from 'express';

import { verifyToken } from '../middleware/auth-middleware';
import {
  createMember,
  getMemberDetail,
  getMemberList,
  memberCheckIn,
  updateMember,
} from '../services/member-service';

const router = express.Router();

// 获取会员列表
router.get('/list', verifyToken, getMemberList);

// 添加会员
router.post('/', verifyToken, createMember);

// 更新会员信息
router.put('/:id', verifyToken, updateMember);

// 获取会员详情
router.get('/:id', verifyToken, getMemberDetail);

// 会员签到
router.post('/checkIn', verifyToken, memberCheckIn);

export default router;
