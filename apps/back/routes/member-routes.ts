import { Router } from 'express';

import { verifyToken } from '../middleware/auth-middleware';
import {
  createMember,
  deleteMember,
  getMemberByPhone,
  getMemberDetail,
  getMemberList,
  getMemberOptions,
  memberCheckIn,
  updateMember,
} from '../services/member-service';

const router = Router();

// 所有路由都需要认证
router.use(verifyToken);

// 获取会员列表
router.get('/list', getMemberList);

// 获取会员选项
router.get('/options', getMemberOptions);

// 通过手机号查找会员
router.get('/phone/:phone', getMemberByPhone);

// 添加会员
router.post('/', createMember);

// 更新会员信息
router.put('/:id', updateMember);

// 获取会员详情
router.get('/:id', getMemberDetail);

// 会员签到
router.post('/checkin', memberCheckIn);

// 删除会员
router.delete('/:id', deleteMember);

export default router;
