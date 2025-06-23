import { Router } from 'express';

import { adminOnly, verifyToken } from '../middleware/auth-middleware';
import {
  addStaff,
  deleteStaff,
  getStaffDetail,
  getStaffList,
  updateStaff,
} from '../services/staff-service';

const router = Router();

// 所有路由都需要认证
router.use(verifyToken);

// 获取员工列表
router.get('/', adminOnly, getStaffList);

// 获取员工详情
router.get('/:id', adminOnly, getStaffDetail);

// 添加员工
router.post('/', adminOnly, addStaff);

// 更新员工信息
router.put('/:id', adminOnly, updateStaff);

// 删除员工
router.delete('/:id', adminOnly, deleteStaff);

export default router;
