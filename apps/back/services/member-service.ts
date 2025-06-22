import { Request, Response } from 'express';

import prisma from '../utils/db';

// 获取会员列表
export async function getMemberList(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 10,
      name,
      phone,
      membership_type,
      status,
    } = req.query;

    const queryParams: any[] = [];
    const conditions = [];
    let paramIndex = 1;

    if (name) {
      conditions.push(`name ILIKE $${paramIndex}`);
      queryParams.push(`%${name}%`);
      paramIndex++;
    }

    if (phone) {
      conditions.push(`phone LIKE $${paramIndex}`);
      queryParams.push(`%${phone}%`);
      paramIndex++;
    }

    if (membership_type) {
      conditions.push(`membership_type = $${paramIndex}`);
      queryParams.push(membership_type);
      paramIndex++;
    }

    if (status !== undefined && status !== '') {
      conditions.push(`status = $${paramIndex}`);
      queryParams.push(Number(status));
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as count FROM members ${whereClause}`;
    const countResult = (await prisma.$queryRawUnsafe(
      countQuery,
      ...queryParams,
    )) as any[];
    const total = Number(countResult[0].count);

    const offset = (Number(page) - 1) * Number(pageSize);
    const paginationParams = [...queryParams, Number(pageSize), offset];

    const query = `
      SELECT 
        m.*,
        u.real_name as coach_name
      FROM 
        members m
      LEFT JOIN 
        users u ON m.coach_id = u.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = (await prisma.$queryRawUnsafe(
      query,
      ...paginationParams,
    )) as any[];

    return res.status(200).json({
      code: 0,
      message: '获取会员列表成功',
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
    console.error('获取会员列表失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 添加会员
export async function createMember(req: Request, res: Response) {
  try {
    const {
      name,
      gender,
      birth_date,
      phone,
      email,
      address,
      join_date,
      expire_date,
      membership_type,
      coach_id,
      remark,
    } = req.body;

    if (!name || !phone || !join_date || !expire_date || !membership_type) {
      return res.status(400).json({
        code: 400,
        message:
          '缺少必要参数：姓名、手机号、入会日期、过期日期、会员类型为必填项',
        data: null,
      });
    }

    const joinDate = new Date(join_date);
    const expireDate = new Date(expire_date);

    if (isNaN(joinDate.getTime()) || isNaN(expireDate.getTime())) {
      return res.status(400).json({
        code: 400,
        message: '日期格式不正确',
        data: null,
      });
    }

    if (expireDate <= joinDate) {
      return res.status(400).json({
        code: 400,
        message: '过期日期必须晚于入会日期',
        data: null,
      });
    }

    const existingMember = await prisma.$queryRaw<any[]>`
      SELECT id FROM members WHERE phone = ${phone}
    `;

    if (existingMember.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该手机号已注册',
        data: null,
      });
    }

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO members (
        name, gender, birth_date, phone, email, address,
        join_date, expire_date, membership_type, coach_id, remark
      ) VALUES (
        ${name}, 
        ${gender}, 
        ${birth_date ? new Date(birth_date) : null}, 
        ${phone}, 
        ${email}, 
        ${address}, 
        ${new Date(join_date)}, 
        ${new Date(expire_date)}, 
        ${membership_type}, 
        ${coach_id}, 
        ${remark}
      ) 
      RETURNING *
    `;

    return res.status(201).json({
      code: 0,
      message: '添加会员成功',
      data: result[0],
    });
  } catch (error) {
    console.error('添加会员失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 更新会员信息
export async function updateMember(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      gender,
      birth_date,
      phone,
      email,
      address,
      join_date,
      expire_date,
      membership_type,
      coach_id,
      status,
      remark,
    } = req.body;

    if (!name || !phone || !join_date || !expire_date || !membership_type) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    const existingMember = await prisma.$queryRaw<any[]>`
      SELECT id FROM members WHERE id = ${Number(id)}
    `;

    if (existingMember.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '会员不存在',
        data: null,
      });
    }

    const phoneCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM members WHERE phone = ${phone} AND id != ${Number(id)}
    `;

    if (phoneCheck.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该手机号已被其他会员使用',
        data: null,
      });
    }

    const result = await prisma.$queryRaw<any[]>`
      UPDATE members SET
        name = ${name}, 
        gender = ${gender}, 
        birth_date = ${birth_date ? new Date(birth_date) : null}, 
        phone = ${phone}, 
        email = ${email}, 
        address = ${address}, 
        join_date = ${new Date(join_date)}, 
        expire_date = ${new Date(expire_date)},
        membership_type = ${membership_type}, 
        coach_id = ${coach_id}, 
        status = ${Number(status)}, 
        remark = ${remark}, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)} RETURNING *
    `;

    return res.status(200).json({
      code: 0,
      message: '更新会员信息成功',
      data: result[0],
    });
  } catch (error) {
    console.error('更新会员信息失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 获取会员详情
export async function getMemberDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM members WHERE id = ${Number(id)} AND status != 0
    `;

    if (result.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '会员不存在或已被删除',
        data: null,
      });
    }

    return res.status(200).json({
      code: 0,
      message: '获取会员详情成功',
      data: result[0],
    });
  } catch (error) {
    console.error('获取会员详情失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 会员签到
export async function memberCheckIn(req: Request, res: Response) {
  try {
    const { member_id } = req.body;

    if (!member_id) {
      return res.status(400).json({
        code: 400,
        message: '缺少会员ID',
        data: null,
      });
    }

    const memberCheck = await prisma.$queryRaw<any[]>`
      SELECT id, status, expire_date FROM members WHERE id = ${Number(member_id)}
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
        message: '会员状态异常，无法签到',
        data: null,
      });
    }

    const now = new Date();
    if (new Date(member.expire_date) < now) {
      return res.status(400).json({
        code: 400,
        message: '会员已过期，请续费后再签到',
        data: null,
      });
    }

    // 记录签到
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO check_ins (member_id) VALUES (${Number(member_id)}) RETURNING *
    `;

    return res.status(201).json({
      code: 0,
      message: '签到成功',
      data: result[0],
    });
  } catch (error) {
    console.error('会员签到失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 删除会员
export async function deleteMember(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const memberCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM members WHERE id = ${Number(id)}
    `;

    if (memberCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '会员不存在',
        data: null,
      });
    }

    await prisma.$queryRaw`
      DELETE FROM members WHERE id = ${Number(id)}
    `;

    return res.status(200).json({
      code: 0,
      message: '删除会员成功',
      data: null,
    });
  } catch (error) {
    console.error('删除会员失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 获取会员选项列表
export async function getMemberOptions(req: Request, res: Response) {
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT id, name, phone 
      FROM members 
      WHERE status = 1 AND expire_date > CURRENT_DATE
      ORDER BY name ASC
    `;

    return res.status(200).json({
      code: 0,
      message: '获取会员选项成功',
      data: result,
    });
  } catch (error) {
    console.error('获取会员选项失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 通过手机号查找会员
export async function getMemberByPhone(req: Request, res: Response) {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        code: 400,
        message: '缺少手机号参数',
        data: null,
      });
    }

    const member = await prisma.$queryRaw<any[]>`
      SELECT id, name, phone, status, expire_date, membership_type, created_at
      FROM members 
      WHERE phone = ${phone}
      LIMIT 1
    `;

    if (member.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '未找到该手机号对应的会员',
        data: null,
      });
    }

    return res.status(200).json({
      code: 0,
      message: '查询成功',
      data: member[0],
    });
  } catch (error) {
    console.error('查询会员失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}
