import express from 'express';

import { coachOrAdmin, verifyToken } from '../middleware/auth-middleware';
import {
  bookCourse,
  cancelBooking,
  cancelCourse,
  createCourse,
  getCoachCourseStats,
  getCourseList,
  updateCourse,
} from '../services/course-service';

const router = express.Router();

// 获取课程列表
router.get('/list', verifyToken, getCourseList);

// 添加课程
router.post('/', verifyToken, coachOrAdmin, createCourse);

// 更新课程
router.put('/:id', verifyToken, coachOrAdmin, updateCourse);

// 取消课程
router.put('/:id/cancel', verifyToken, coachOrAdmin, cancelCourse);

// 预约课程
router.post('/book', verifyToken, bookCourse);

// 取消预约
router.post('/cancel-booking', verifyToken, cancelBooking);

// 获取教练课程统计
router.get('/coach-stats', verifyToken, coachOrAdmin, getCoachCourseStats);

export default router;
