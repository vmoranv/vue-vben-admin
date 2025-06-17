import { Request, Response } from 'express';

import prisma from '../utils/db';

// 获取课程列表
export async function getCourseList(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 10,
      name,
      coach_id,
      course_type,
      start_date,
      end_date,
    } = req.query;

    // 构建查询条件
    const queryParams: any[] = [];
    const conditions = [];
    let paramIndex = 1;

    if (name) {
      conditions.push(`c.name ILIKE $${paramIndex}`);
      queryParams.push(`%${name}%`);
      paramIndex++;
    }

    if (coach_id) {
      conditions.push(`c.coach_id = $${paramIndex}`);
      queryParams.push(coach_id);
      paramIndex++;
    }

    if (course_type) {
      conditions.push(`c.course_type = $${paramIndex}`);
      queryParams.push(course_type);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`c.start_time >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`c.start_time <= $${paramIndex}`);
      queryParams.push(end_date);
      paramIndex++;
    }

    // 构建WHERE子句
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 计算总记录数
    const countQuery = `
      SELECT COUNT(*) as count
      FROM courses c
      ${whereClause}
    `;
    const countResult = await prisma.$queryRaw<
      [{ count: bigint }]
    >`${countQuery}`;
    const total = Number(countResult[0].count);

    // 查询分页数据
    const offset = (Number(page) - 1) * Number(pageSize);
    const _paginationParams = [...queryParams, Number(pageSize), offset];

    const query = `
      SELECT 
        c.*,
        u.real_name as coach_name,
        (SELECT COUNT(*) FROM course_bookings cb WHERE cb.course_id = c.id AND cb.status = 1) as booking_count
      FROM 
        courses c
      LEFT JOIN 
        users u ON c.coach_id = u.id
      ${whereClause}
      ORDER BY c.start_time ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await prisma.$queryRaw<any[]>`${query}`;

    return res.status(200).json({
      code: 0,
      message: '获取课程列表成功',
      data: {
        list: result,
        pagination: {
          current: Number(page),
          pageSize: Number(pageSize),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取课程列表失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 添加课程
export async function createCourse(req: Request, res: Response) {
  try {
    const {
      name,
      coach_id,
      start_time,
      end_time,
      capacity,
      location,
      course_type,
      price,
      remark,
    } = req.body;

    if (!name || !coach_id || !start_time || !end_time || !capacity) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    // 检查教练是否存在
    const coachCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM users WHERE id = ${coach_id} AND role_id = (SELECT id FROM roles WHERE name = ${'coach'})
    `;

    if (coachCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '教练不存在',
        data: null,
      });
    }

    // 检查时间冲突
    const timeConflictCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM courses 
      WHERE coach_id = ${coach_id} 
      AND status = 1
      AND (
        (start_time <= ${start_time} AND end_time > ${start_time}) OR
        (start_time < ${end_time} AND end_time >= ${end_time}) OR
        (start_time >= ${start_time} AND end_time <= ${end_time})
      )
    `;

    if (timeConflictCheck.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该时间段内教练已有其他课程安排',
        data: null,
      });
    }

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO courses (
        name, coach_id, start_time, end_time, capacity,
        location, course_type, price, remark
      ) VALUES (${name}, ${coach_id}, ${start_time}, ${end_time}, ${capacity}, ${location}, ${course_type}, ${price}, ${remark}) 
      RETURNING *
    `;

    return res.status(201).json({
      code: 0,
      message: '添加课程成功',
      data: result[0],
    });
  } catch (error) {
    console.error('添加课程失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 更新课程
export async function updateCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      coach_id,
      start_time,
      end_time,
      capacity,
      location,
      course_type,
      price,
      remark,
    } = req.body;

    // 检查课程是否存在
    const courseCheck = await prisma.$queryRaw<any[]>`
      SELECT id, coach_id, start_time, end_time, capacity, location, course_type, price, remark 
      FROM courses WHERE id = ${Number(id)}
    `;

    if (courseCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '课程不存在',
        data: null,
      });
    }

    // 检查教练是否存在
    const coachCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM users WHERE id = ${coach_id} AND role_id = (SELECT id FROM roles WHERE name = ${'coach'})
    `;

    if (coachCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '教练不存在',
        data: null,
      });
    }

    // 检查时间冲突（排除当前课程）
    const timeConflictCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM courses 
      WHERE coach_id = ${coach_id} 
      AND status = 1
      AND id != ${Number(id)}
      AND (
        (start_time <= ${start_time} AND end_time > ${start_time}) OR
        (start_time < ${end_time} AND end_time >= ${end_time}) OR
        (start_time >= ${start_time} AND end_time <= ${end_time})
      )
    `;

    if (timeConflictCheck.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该时间段内教练已有其他课程安排',
        data: null,
      });
    }

    const result = await prisma.$queryRaw<any[]>`
      UPDATE courses 
      SET 
        name = ${name}, coach_id = ${coach_id}, start_time = ${start_time}, end_time = ${end_time}, capacity = ${capacity},
        location = ${location}, course_type = ${course_type}, price = ${price}, remark = ${remark}  
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    return res.status(200).json({
      code: 0,
      message: '课程更新成功',
      data: result[0],
    });
  } catch (error) {
    console.error('更新课程失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 取消课程
export async function cancelCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // 检查课程是否存在
    const courseCheck = await prisma.$queryRaw<any[]>`
      SELECT id, start_time FROM courses WHERE id = ${Number(id)}
    `;

    if (courseCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '课程不存在',
        data: null,
      });
    }

    const course = courseCheck[0];
    const now = new Date();
    const courseStartTime = new Date(course.start_time);

    if (courseStartTime < now) {
      return res.status(400).json({
        code: 400,
        message: '课程已开始，无法取消',
        data: null,
      });
    }

    // 使用事务处理课程取消和预约取消
    await prisma.$transaction(async (tx) => {
      // 更新课程状态为已取消
      await tx.$queryRaw`
        UPDATE courses SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ${Number(id)}
      `;

      // 更新所有与该课程相关的预约状态为已取消
      await tx.$queryRaw`
        UPDATE course_bookings SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE course_id = ${Number(id)}
      `;
    });

    return res.status(200).json({
      code: 0,
      message: '取消课程成功',
      data: null,
    });
  } catch (error) {
    console.error('取消课程失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 会员预约课程
export async function bookCourse(req: Request, res: Response) {
  try {
    const { member_id, course_id } = req.body;

    if (!member_id || !course_id) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    // 检查会员是否存在且有效
    const memberCheck = await prisma.$queryRaw<any[]>`
      SELECT id, status, expire_date FROM members WHERE id = ${member_id}
    `;

    if (memberCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '会员不存在',
        data: null,
      });
    }

    const member = memberCheck[0];

    if (member.status !== 1) {
      return res.status(400).json({
        code: 400,
        message: '会员状态异常，无法预约课程',
        data: null,
      });
    }

    const now = new Date();
    if (new Date(member.expire_date) < now) {
      return res.status(400).json({
        code: 400,
        message: '会员已过期，请续费后再预约课程',
        data: null,
      });
    }

    // 检查课程是否存在且有效
    const courseCheck = await prisma.$queryRaw<any[]>`
      SELECT id, capacity, current_participants, status, start_time 
      FROM courses WHERE id = ${course_id}
    `;

    if (courseCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '课程不存在',
        data: null,
      });
    }

    const course = courseCheck[0];

    if (course.status !== 1) {
      return res.status(400).json({
        code: 400,
        message: '该课程已被取消',
        data: null,
      });
    }

    if (course.current_participants >= course.capacity) {
      return res.status(400).json({
        code: 400,
        message: '该课程已满员',
        data: null,
      });
    }

    const courseStartTime = new Date(course.start_time);
    if (courseStartTime < now) {
      return res.status(400).json({
        code: 400,
        message: '该课程已开始，无法预约',
        data: null,
      });
    }

    // 检查是否已经预约过该课程
    const bookingCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM course_bookings WHERE member_id = ${member_id} AND course_id = ${course_id} AND status = 1
    `;

    if (bookingCheck.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '你已经预约过该课程',
        data: null,
      });
    }

    // 使用事务处理预约和参与人数更新
    const result = await prisma.$transaction(async (tx) => {
      // 创建预约
      const booking = await tx.$queryRaw<any[]>`
        INSERT INTO course_bookings (member_id, course_id) VALUES (${member_id}, ${course_id}) RETURNING *
      `;

      // 更新课程当前参与人数
      await tx.$queryRaw`
        UPDATE courses SET current_participants = current_participants + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ${course_id}
      `;

      return booking[0];
    });

    return res.status(201).json({
      code: 0,
      message: '预约课程成功',
      data: result,
    });
  } catch (error) {
    console.error('预约课程失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 取消预约
export async function cancelBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // 检查预约是否存在
    const bookingCheck = await prisma.$queryRaw<any[]>`
      SELECT 
        b.id, b.member_id, b.course_id, b.status,
        c.start_time, c.current_participants
      FROM 
        course_bookings b
      JOIN 
        courses c ON b.course_id = c.id
      WHERE 
        b.id = ${Number(id)}
    `;

    if (bookingCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '预约不存在',
        data: null,
      });
    }

    const booking = bookingCheck[0];

    if (booking.status !== 1) {
      return res.status(400).json({
        code: 400,
        message: '该预约已取消或已完成',
        data: null,
      });
    }

    const now = new Date();
    const courseStartTime = new Date(booking.start_time);

    if (courseStartTime < now) {
      return res.status(400).json({
        code: 400,
        message: '课程已开始，无法取消预约',
        data: null,
      });
    }

    // 使用事务处理预约取消和参与人数更新
    await prisma.$transaction(async (tx) => {
      // 更新预约状态为已取消
      await tx.$queryRaw`
        UPDATE course_bookings SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ${Number(id)}
      `;

      // 更新课程当前参与人数
      if (booking.current_participants > 0) {
        await tx.$queryRaw`
          UPDATE courses SET current_participants = current_participants - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ${booking.course_id}
        `;
      }
    });

    return res.status(200).json({
      code: 0,
      message: '取消预约成功',
      data: null,
    });
  } catch (error) {
    console.error('取消预约失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 获取教练课时统计
export async function getCoachCourseStats(req: Request, res: Response) {
  try {
    const { coach_id, start_date, end_date } = req.query;

    let whereClause = '';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (coach_id) {
      whereClause += ` AND c.coach_id = $${paramIndex}`;
      queryParams.push(coach_id);
      paramIndex++;
    }

    if (start_date) {
      whereClause += ` AND c.start_time >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereClause += ` AND c.end_time <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }

    const query = `
      SELECT 
        u.id as coach_id,
        u.real_name as coach_name,
        COUNT(c.id) as total_courses,
        SUM(EXTRACT(EPOCH FROM (c.end_time - c.start_time))/3600) as total_hours,
        SUM(c.price) as total_amount
      FROM 
        courses c
      JOIN 
        users u ON c.coach_id = u.id
      WHERE 
        c.status = 1
        ${whereClause}
      GROUP BY 
        u.id, u.real_name
      ORDER BY 
        total_courses DESC
    `;

    const result = await prisma.$queryRaw<any[]>`${query}`;

    return res.status(200).json({
      code: 0,
      message: '获取教练课时统计成功',
      data: result,
    });
  } catch (error) {
    console.error('获取教练课时统计失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}
