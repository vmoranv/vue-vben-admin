import express from 'express';

import { verifyToken } from '../middleware/auth-middleware';
import {
  createMember,
  deleteMember,
  getMemberByPhone,
  getMemberDetail,
  getMemberList,
  memberCheckIn,
  updateMember,
  getMemberOptions
} from '../services/member-service';

const router = express.Router();

// 获取会员列表
router.get('/list', verifyToken, getMemberList);

// 获取会员选项
router.get('/options', verifyToken, getMemberOptions);

// 通过手机号查找会员
router.get('/phone/:phone', verifyToken, getMemberByPhone);

// 添加会员
router.post('/', verifyToken, createMember);

// 更新会员信息
router.put('/:id', verifyToken, updateMember);

// 获取会员详情
router.get('/:id', verifyToken, getMemberDetail);

// 会员签到
router.post('/checkin', verifyToken, memberCheckIn);

// 删除会员
router.delete('/:id', verifyToken, deleteMember);

export default router;
