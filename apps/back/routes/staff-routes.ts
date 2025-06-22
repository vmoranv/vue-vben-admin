import express from 'express';

import { adminOnly, verifyToken } from '../middleware/auth-middleware';
import {
  addStaff,
  deleteStaff,
  getStaffDetail,
  getStaffList,
  updateStaff,
} from '../services/staff-service';

const router = express.Router();

// 获取员工列表
router.get('/', verifyToken, adminOnly, getStaffList);

// 获取员工详情
router.get('/:id', verifyToken, adminOnly, getStaffDetail);

// 添加员工
router.post('/', verifyToken, adminOnly, addStaff);

// 更新员工信息
router.put('/:id', verifyToken, adminOnly, updateStaff);

// 删除员工
router.delete('/:id', verifyToken, adminOnly, deleteStaff);

export default router;
