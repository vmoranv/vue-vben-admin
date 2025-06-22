import express from 'express';

import { coachOrAdmin, verifyToken } from '../middleware/auth-middleware';
import {
  bookCourse,
  cancelBooking,
  cancelCourse,
  createCourse,
  getCoachCourseStats,
  getCourseBookings,
  getCourseDetail,
  getCourseList,
  updateCourse,
  getCoaches,
  deleteCourse
} from '../services/course-service';

const router = express.Router();

// 获取课程列表
router.get('/list', verifyToken, getCourseList);

// 获取教练列表
router.get('/coaches', verifyToken, getCoaches);

// 获取课程预约列表
router.get('/bookings', verifyToken, getCourseBookings);

// 获取单个课程详情
router.get('/:id', verifyToken, getCourseDetail);

// 添加课程
router.post('/', verifyToken, coachOrAdmin, createCourse);

// 更新课程
router.put('/:id', verifyToken, coachOrAdmin, updateCourse);

// 删除课程
router.delete('/:id', verifyToken, coachOrAdmin, deleteCourse);

// 取消课程
router.post('/:id/cancel', verifyToken, coachOrAdmin, cancelCourse);

// 预约课程
router.post('/book', verifyToken, bookCourse);

// 取消预约
router.post('/cancel-booking', verifyToken, cancelBooking);

// 获取教练课程统计
router.get('/coach-stats', verifyToken, coachOrAdmin, getCoachCourseStats);

export default router;
