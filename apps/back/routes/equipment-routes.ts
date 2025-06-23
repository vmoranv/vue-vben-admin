import { Router } from 'express';

import { adminOnly, verifyToken } from '../middleware/auth-middleware';
import {
  addMaintenanceRecord,
  createEquipment,
  deleteEquipment,
  deleteMaintenanceRecord,
  getEquipmentDetail,
  getEquipmentList,
  getMaintenanceRecords,
  updateEquipment,
} from '../services/equipment-service';

const router = Router();

// 所有路由都需要认证
router.use(verifyToken);

// 获取设备列表
router.get('/list', getEquipmentList);

// 添加设备
router.post('/create', adminOnly, createEquipment);

// 添加设备维护记录
router.post('/maintenance', adminOnly, addMaintenanceRecord);

// 删除维护记录
router.delete('/maintenance/:id', adminOnly, deleteMaintenanceRecord);

// 获取设备维护记录
router.get('/maintenance/:equipment_id', getMaintenanceRecords);

// 获取设备详情
router.get('/detail/:id', getEquipmentDetail);

// 更新设备信息
router.put('/:id', adminOnly, updateEquipment);

// 删除设备
router.delete('/:id', adminOnly, deleteEquipment);

export default router;
