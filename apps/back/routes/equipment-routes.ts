import express from 'express';

import { adminOnly, verifyToken } from '../middleware/auth-middleware';
import {
  addMaintenanceRecord,
  createEquipment,
  getEquipmentList,
  getMaintenanceRecords,
  updateEquipmentStatus,
} from '../services/equipment-service';

const router = express.Router();

// 获取设备列表
router.get('/list', verifyToken, getEquipmentList);

// 添加设备
router.post('/', verifyToken, adminOnly, createEquipment);

// 更新设备状态
router.put('/:id/status', verifyToken, adminOnly, updateEquipmentStatus);

// 添加设备维护记录
router.post('/maintenance', verifyToken, adminOnly, addMaintenanceRecord);

// 获取设备维护记录
router.get('/maintenance/:equipment_id', verifyToken, getMaintenanceRecords);

export default router;
