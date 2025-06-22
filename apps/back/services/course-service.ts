import { Request, Response } from 'express';

import prisma from '../utils/db';
import { Prisma } from '@prisma/client';

// 定义查询结果类型
interface CourseBookingResult {
  id: number;
  member_id: number;
  course_id: number;
  booking_time?: Date;
  status: number;
  created_at: Date;
  updated_at?: Date;
  course_name?: string;
  start_time?: Date;
  end_time?: Date;
  member_name?: string;
  member_phone?: string;
}

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
      queryParams.push(Number(coach_id));
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

    let countResult;
    countResult = await (queryParams.length > 0
      ? prisma.$queryRaw<[{ count: bigint }]>`${countQuery}`
      : prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM courses c
      `);

    const total = Number(countResult[0].count);

    // 查询分页数据
    const offset = (Number(page) - 1) * Number(pageSize);

    let result;
    if (queryParams.length > 0) {
      const paginationParams = [...queryParams, Number(pageSize), offset];
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
      result = await prisma.$queryRaw<any[]>`${query}`;
    } else {
      result = await prisma.$queryRaw<any[]>`
        SELECT 
          c.*,
          u.real_name as coach_name,
          (SELECT COUNT(*) FROM course_bookings cb WHERE cb.course_id = c.id AND cb.status = 1) as booking_count
        FROM 
          courses c
        LEFT JOIN 
          users u ON c.coach_id = u.id
        ORDER BY c.start_time ASC
        LIMIT ${Number(pageSize)} OFFSET ${offset}
      `;
    }

    const processedResult = result.map(item => {
      const processed = { ...item } as Record<string, any>;
      Object.keys(processed).forEach(key => {
        if (typeof processed[key] === 'bigint') {
          processed[key] = Number(processed[key]);
        }
      });
      return processed as CourseBookingResult;
    });

    return res.status(200).json({
      code: 0,
      message: '获取课程列表成功',
      data: {
        list: processedResult,
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
    const { name, coach_id, course_type, start_time, end_time, capacity, price, location, remark } = req.body;

    if (!name || !coach_id || !course_type || !start_time || !end_time || !capacity) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    const coachExists = await prisma.user.findFirst({
      where: {
        id: Number(coach_id),
        role: {
          name: 'coach',
        },
      },
    });

    if (!coachExists) {
      const userExists = await prisma.user.findUnique({
        where: { id: Number(coach_id) },
        include: { role: true },
      });
      
      const errorMessage = userExists 
        ? `用户"${userExists.username}"不是教练角色，其当前角色是"${userExists.role?.name}"`
        : '所选教练ID不存在';
      
      return res.status(404).json({
        code: 404,
        message: errorMessage,
        data: null,
      });
    }

    // 创建课程
    const course = await prisma.course.create({
      data: {
        name,
        coachId: Number(coach_id),
        courseType: course_type,
        startTime: new Date(start_time),
        endTime: new Date(end_time),
        capacity: Number(capacity),
        currentParticipants: 0,
        price: Number(price || 0),
        location: location || '',
        remark: remark || '',
        status: 1,
      },
    });

    return res.status(200).json({
      code: 0,
      message: '创建课程成功',
      data: course,
    });
  } catch (error) {
    console.error('创建课程失败：', error);
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
      course_type,
      start_time,
      end_time,
      capacity,
      price,
    } = req.body;

    if (!name || !coach_id || !course_type || !start_time || !end_time || !capacity || price === undefined) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    const existingCourse = await prisma.$queryRaw<any[]>`
      SELECT id, coach_id, start_time, end_time, capacity, location, course_type, price, remark
      FROM courses WHERE id = ${Number(id)}
    `;

    if (existingCourse.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '课程不存在',
        data: null,
      });
    }

    const coachExists = await prisma.$queryRaw<any[]>`
      SELECT id FROM users WHERE id = ${Number(coach_id)} AND role_id = (SELECT id FROM roles WHERE name = 'coach')
    `;

    if (coachExists.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '指定的教练不存在',
        data: null,
      });
    }

    const conflictingCourses = await prisma.$queryRaw<any[]>`
      SELECT id FROM courses
      WHERE coach_id = ${Number(coach_id)}
      AND status = 1
      AND id != ${Number(id)}
      AND (
        (start_time <= ${start_time}::timestamp AND end_time > ${start_time}::timestamp) OR
        (start_time < ${end_time}::timestamp AND end_time >= ${end_time}::timestamp) OR
        (start_time >= ${start_time}::timestamp AND end_time <= ${end_time}::timestamp)
      )
    `;

    if (conflictingCourses.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该教练在此时间段已有其他课程安排',
        data: null,
      });
    }

    // 更新课程
    const updatedCourse = await prisma.$queryRaw`
      UPDATE courses SET 
        name = ${name},
        coach_id = ${Number(coach_id)},
        course_type = ${course_type},
        start_time = ${start_time}::timestamp,
        end_time = ${end_time}::timestamp,
        capacity = ${Number(capacity)},
        price = ${Number(price)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)}
    `;

    return res.status(200).json({
      code: 0,
      message: '更新课程成功',
      data: null,
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

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        UPDATE courses SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ${Number(id)}
      `;

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
        data: null
      });
    }
    
    const course = await prisma.course.findUnique({
      where: { id: Number(course_id) }
    });
    
    if (!course) {
      return res.status(404).json({
        code: 404,
        message: '课程不存在',
        data: null
      });
    }
    
    const now = new Date();
    const bookingDeadlineMinutes = 30;
    const bookingDeadline = new Date(course.startTime);
    bookingDeadline.setMinutes(bookingDeadline.getMinutes() - bookingDeadlineMinutes);

    if (now >= bookingDeadline) {
      return res.status(400).json({
        code: 400,
        message: `课程即将开始，已超过预约时间（开始前${bookingDeadlineMinutes}分钟截止）`,
        data: null
      });
    }
    
    const existingBooking = await prisma.courseBooking.findFirst({
      where: {
        memberId: Number(member_id),
        courseId: Number(course_id),
        status: 1
      }
    });
    
    if (existingBooking) {
      return res.status(400).json({
        code: 400,
        message: '您已预约过此课程',
        data: null
      });
    }
    
    const bookingCount = await prisma.courseBooking.count({
      where: {
        courseId: Number(course_id),
        status: 1
      }
    });
    
    if (bookingCount >= course.capacity) {
      return res.status(400).json({
        code: 400,
        message: '课程预约已满',
        data: null
      });
    }
    
    const booking = await prisma.courseBooking.create({
      data: {
        memberId: Number(member_id),
        courseId: Number(course_id),
        bookingTime: new Date(),
        status: 1
      }
    });
    
    return res.status(201).json({
      code: 0,
      message: '预约成功',
      data: booking
    });
  } catch (error) {
    console.error('预约课程失败:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
}

// 取消预约
export async function cancelBooking(req: Request, res: Response) {
  try {
    const { id } = req.body;

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

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        UPDATE course_bookings SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ${Number(id)}
      `;

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

// 获取课程预约列表
export async function getCourseBookings(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 10, member_name, course_name, status } = req.query;
    
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    // 构建查询条件
    let whereConditions: string[] = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (member_name) {
      whereConditions.push(`m.name ILIKE $${paramIndex}`);
      queryParams.push(`%${member_name}%`);
      paramIndex++;
    }

    if (course_name) {
      whereConditions.push(`c.name ILIKE $${paramIndex}`);
      queryParams.push(`%${course_name}%`);
      paramIndex++;
    }

    if (status !== undefined && status !== '') {
      whereConditions.push(`cb.status = $${paramIndex}`);
      queryParams.push(Number(status));
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as count
      FROM course_bookings cb
      LEFT JOIN courses c ON cb.course_id = c.id
      LEFT JOIN members m ON cb.member_id = m.id
      WHERE ${whereClause}
    `;

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...queryParams);
    const total = Number((countResult as any)[0]?.count || 0);

    // 查询数据列表
    const dataQuery = `
      SELECT 
        cb.id,
        cb.course_id,
        cb.member_id,
        cb.status,
        cb.created_at,
        c.name as course_name,
        c.start_time as course_time,
        m.name as member_name,
        m.phone as member_phone
      FROM course_bookings cb
      LEFT JOIN courses c ON cb.course_id = c.id
      LEFT JOIN members m ON cb.member_id = m.id
      WHERE ${whereClause}
      ORDER BY cb.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await prisma.$queryRawUnsafe(
      dataQuery, 
      ...queryParams, 
      limit, 
      offset
    );

    return res.status(200).json({
      code: 0,
      message: '获取课程预约列表成功',
      data: {
        list: dataResult,
        pagination: {
          current: Number(page),
          pageSize: Number(pageSize),
          total: total,
        },
      },
    });
  } catch (error) {
    console.error('获取课程预约列表失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 获取所有教练
export async function getCoaches(req: Request, res: Response) {
  try {
    const coaches = await prisma.user.findMany({
      where: {
        role: {
          name: 'coach'
        },
        status: 1
      },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true
      }
    });
    
    return res.status(200).json({
      code: 0,
      message: '获取教练列表成功',
      data: coaches
    });
  } catch (error) {
    console.error('获取教练列表失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
}

// 获取课程详情
export async function getCourseDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        coach: {
          select: {
            realName: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        code: 404,
        message: '课程不存在',
        data: null,
      });
    }

    const courseData = {
      id: course.id,
      name: course.name,
      coach_id: course.coachId,
      start_time: course.startTime,
      end_time: course.endTime,
      capacity: course.capacity,
      current_participants: course.currentParticipants,
      location: course.location,
      course_type: course.courseType,
      price: course.price,
      status: course.status,
      remark: course.remark,
      created_at: course.createdAt,
      updated_at: course.updatedAt,
      coach: course.coach,
    };

    return res.status(200).json({
      code: 0,
      message: '获取课程详情成功',
      data: courseData,
    });
  } catch (error) {
    console.error('获取课程详情失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 删除课程
export async function deleteCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existingCourse = await prisma.course.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!existingCourse) {
      return res.status(404).json({
        code: 404,
        message: '课程不存在',
        data: null,
      });
    }

    const bookings = await prisma.courseBooking.findMany({
      where: {
        courseId: Number(id),
        status: 1
      }
    });

    if (bookings.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该课程已有用户预约，无法删除',
        data: null,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.courseBooking.deleteMany({
        where: {
          courseId: Number(id)
        }
      });

      await tx.course.delete({
        where: {
          id: Number(id)
        }
      });
    });

    return res.status(200).json({
      code: 0,
      message: '删除课程成功',
      data: null,
    });
  } catch (error) {
    console.error('删除课程失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}