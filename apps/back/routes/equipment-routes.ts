import express from 'express';

import { adminOnly, verifyToken } from '../middleware/auth-middleware';
import {
  addMaintenanceRecord,
  createEquipment,
  getEquipmentDetail,
  getEquipmentList,
  getMaintenanceRecords,
  updateEquipment,
  deleteEquipment,
} from '../services/equipment-service';

const router = express.Router();

// 获取设备列表
router.get('/list', verifyToken, getEquipmentList);

// 添加设备
router.post('/create', verifyToken, adminOnly, createEquipment);

// 添加设备维护记录
router.post('/maintenance', verifyToken, adminOnly, addMaintenanceRecord);

// 获取设备维护记录
router.get('/maintenance/:equipment_id', verifyToken, getMaintenanceRecords);

// 获取设备详情
router.get('/detail/:id', verifyToken, getEquipmentDetail);

// 更新设备信息
router.put('/:id', verifyToken, adminOnly, updateEquipment);

// 删除设备
router.delete('/:id', verifyToken, adminOnly, deleteEquipment);

export default router;
