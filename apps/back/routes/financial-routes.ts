import { Router } from 'express';

import { verifyToken } from '../middleware/auth-middleware';
import {
  addCoachingFee,
  addMembershipFee,
  addOtherFinancialRecord,
  getFinancialRecords,
  getFinancialStats,
} from '../services/financial-service';

const router = Router();

// 获取财务记录列表
router.get('/list', verifyToken, getFinancialRecords);

// 添加会员费收入记录
router.post('/membership-fee', verifyToken, addMembershipFee);

// 添加私教费收入记录
router.post('/coach-fee', verifyToken, addCoachingFee);

// 添加其他财务记录
router.post('/', verifyToken, addOtherFinancialRecord);

// 获取财务统计数据
router.get('/statistics', verifyToken, getFinancialStats);

export default router;
