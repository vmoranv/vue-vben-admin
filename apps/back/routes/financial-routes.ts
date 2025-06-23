import { Router } from 'express';

import { verifyToken } from '../middleware/auth-middleware';
import {
  addCoachingFee,
  addMembershipFee,
  addOtherFinancialRecord,
  createFinancialRecord,
  deleteFinancialRecord,
  getFinancialRecordDetail,
  getFinancialRecords,
  getFinancialStats,
  updateFinancialRecord,
} from '../services/financial-service';

const router = Router();

// 所有路由都需要认证
router.use(verifyToken);

// 获取财务统计数据
router.get('/statistics', getFinancialStats);

// 获取财务记录列表
router.get('/records', getFinancialRecords);

// 创建财务记录
router.post('/records', createFinancialRecord);

// 获取财务记录详情
router.get('/records/:id', getFinancialRecordDetail);

// 更新财务记录
router.put('/records/:id', updateFinancialRecord);

// 删除财务记录
router.delete('/records/:id', deleteFinancialRecord);

// 添加会员费收入记录
router.post('/membership-fee', addMembershipFee);

// 添加私教费收入记录
router.post('/coach-fee', addCoachingFee);

// 添加其他财务记录
router.post('/', addOtherFinancialRecord);

export default router;
