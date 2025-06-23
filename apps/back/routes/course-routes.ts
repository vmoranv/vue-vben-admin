import { Router } from 'express';

import { coachOrAdmin, verifyToken } from '../middleware/auth-middleware';
import {
  bookCourse,
  cancelBooking,
  cancelCourse,
  createCourse,
  deleteCourse,
  getCoachCourseStats,
  getCoaches,
  getCourseBookings,
  getCourseDetail,
  getCourseList,
  updateCourse,
} from '../services/course-service';

const router = Router();

// 所有路由都需要认证
router.use(verifyToken);

// 获取课程列表
router.get('/list', getCourseList);

// 获取教练列表
router.get('/coaches', getCoaches);

// 获取课程预约列表
router.get('/bookings', getCourseBookings);

// 获取单个课程详情
router.get('/:id', getCourseDetail);

// 添加课程
router.post('/', coachOrAdmin, createCourse);

// 更新课程
router.put('/:id', coachOrAdmin, updateCourse);

// 删除课程
router.delete('/:id', coachOrAdmin, deleteCourse);

// 取消课程
router.post('/:id/cancel', coachOrAdmin, cancelCourse);

// 预约课程
router.post('/book', bookCourse);

// 取消预约
router.post('/cancel-booking', cancelBooking);

// 获取教练课程统计
router.get('/coach-stats', coachOrAdmin, getCoachCourseStats);

export default router;
