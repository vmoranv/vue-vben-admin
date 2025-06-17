import { Request, Response } from 'express';

import prisma from '../utils/db';

// 获取财务记录列表
export async function getFinancialRecords(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 10,
      record_type,
      member_id,
      coach_id,
      start_date,
      end_date,
    } = req.query;

    // 构建查询条件
    const queryParams: any[] = [];
    const conditions = [];
    let paramIndex = 1;

    if (record_type) {
      conditions.push(`f.record_type = $${paramIndex}`);
      queryParams.push(record_type);
      paramIndex++;
    }

    if (member_id) {
      conditions.push(`f.member_id = $${paramIndex}`);
      queryParams.push(member_id);
      paramIndex++;
    }

    if (coach_id) {
      conditions.push(`f.coach_id = $${paramIndex}`);
      queryParams.push(coach_id);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`f.record_date >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`f.record_date <= $${paramIndex}`);
      queryParams.push(end_date);
      paramIndex++;
    }

    // 构建WHERE子句
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 计算总记录数
    const countQuery = `
      SELECT COUNT(*) as count
      FROM financial_records f
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
        f.*,
        m.name as member_name,
        c.real_name as coach_name,
        o.real_name as operator_name
      FROM 
        financial_records f
      LEFT JOIN 
        members m ON f.member_id = m.id
      LEFT JOIN 
        users c ON f.coach_id = c.id
      LEFT JOIN 
        users o ON f.operator_id = o.id
      ${whereClause}
      ORDER BY f.record_date DESC, f.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await prisma.$queryRaw<any[]>`${query}`;

    return res.status(200).json({
      code: 0,
      message: '获取财务记录成功',
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
    console.error('获取财务记录失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 添加会员费收入记录
export async function addMembershipFee(req: Request, res: Response) {
  try {
    const { member_id, amount, record_date, description } = req.body;
    const operatorId = req.user?.id;

    if (!member_id || !amount || !record_date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    // 检查会员是否存在
    const memberCheck = await prisma.$queryRaw<any[]>`
      SELECT id, expire_date FROM members WHERE id = ${member_id}
    `;

    if (memberCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '会员不存在',
        data: null,
      });
    }

    // 使用事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 添加财务记录
      const financialResult = await tx.$queryRaw<any[]>`
        INSERT INTO financial_records (
          record_type, amount, member_id, record_date,
          description, operator_id
        ) VALUES (${`会员费`}, ${amount}, ${member_id}, ${record_date}, ${description}, ${operatorId}) 
        RETURNING *
      `;

      // 更新会员的到期日期
      const member = memberCheck[0];
      const newExpireDate = new Date(
        Math.max(new Date(member.expire_date).getTime(), Date.now()),
      );

      // 按金额自动延长会员期限（每100元延长1个月）
      const monthsToAdd = Math.floor(Number(amount) / 100);
      newExpireDate.setMonth(newExpireDate.getMonth() + monthsToAdd);

      await tx.$queryRaw`
        UPDATE members SET 
          expire_date = ${newExpireDate}, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${member_id}
      `;

      return {
        ...financialResult[0],
        new_expire_date: newExpireDate,
      };
    });

    return res.status(201).json({
      code: 0,
      message: '添加会员费记录成功',
      data: result,
    });
  } catch (error) {
    console.error('添加会员费记录失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 添加私教费收入记录
export async function addCoachingFee(req: Request, res: Response) {
  try {
    const { member_id, coach_id, amount, record_date, description } = req.body;
    const operatorId = req.user?.id;

    if (!member_id || !coach_id || !amount || !record_date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    // 检查会员是否存在
    const memberCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM members WHERE id = ${member_id}
    `;

    if (memberCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '会员不存在',
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

    // 添加财务记录
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO financial_records (
        record_type, amount, member_id, coach_id,
        record_date, description, operator_id
      ) VALUES (${`私教费`}, ${amount}, ${member_id}, ${coach_id}, ${record_date}, ${description}, ${operatorId}) 
      RETURNING *
    `;

    return res.status(201).json({
      code: 0,
      message: '添加私教费记录成功',
      data: result[0],
    });
  } catch (error) {
    console.error('添加私教费记录失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 添加其他收入/支出记录
export async function addOtherFinancialRecord(req: Request, res: Response) {
  try {
    const { record_type, amount, record_date, description } = req.body;
    const operatorId = req.user?.id;

    if (!record_type || !amount || !record_date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    if (!['其他收入', '支出'].includes(record_type)) {
      return res.status(400).json({
        code: 400,
        message: '无效的记录类型',
        data: null,
      });
    }

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO financial_records (
        record_type, amount, record_date,
        description, operator_id
      ) VALUES (${record_type}, ${amount}, ${record_date}, ${description}, ${operatorId}) 
      RETURNING *
    `;

    return res.status(201).json({
      code: 0,
      message: '添加财务记录成功',
      data: result[0],
    });
  } catch (error) {
    console.error('添加财务记录失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 获取财务统计报表
export async function getFinancialStats(req: Request, res: Response) {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;

    let timeFormat = '';
    let groupByClause = '';

    // 根据分组方式设置日期格式和分组子句
    if (group_by === 'month') {
      timeFormat = 'YYYY-MM';
      groupByClause = `TO_CHAR(record_date, 'YYYY-MM')`;
    } else if (group_by === 'year') {
      timeFormat = 'YYYY';
      groupByClause = `TO_CHAR(record_date, 'YYYY')`;
    } else {
      timeFormat = 'YYYY-MM-DD';
      groupByClause = `TO_CHAR(record_date, 'YYYY-MM-DD')`;
    }

    let whereClause = '';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (start_date) {
      whereClause += ` AND record_date >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereClause += ` AND record_date <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }

    const query = `
      SELECT 
        ${groupByClause} as time_period,
        SUM(CASE WHEN record_type = '会员费' THEN amount ELSE 0 END) as membership_income,
        SUM(CASE WHEN record_type = '私教费' THEN amount ELSE 0 END) as coaching_income,
        SUM(CASE WHEN record_type = '其他收入' THEN amount ELSE 0 END) as other_income,
        SUM(CASE WHEN record_type = '支出' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN record_type IN ('会员费', '私教费', '其他收入') THEN amount ELSE 0 END) - 
        SUM(CASE WHEN record_type = '支出' THEN amount ELSE 0 END) as profit
      FROM 
        financial_records
      WHERE 
        1=1
        ${whereClause}
      GROUP BY 
        ${groupByClause}
      ORDER BY 
        time_period
    `;

    // 🔧 修复：使用 prisma.$queryRaw 替代 pool.query
    const result = await prisma.$queryRaw<any[]>`${query}`;

    // 计算总计
    const totalQuery = `
      SELECT 
        SUM(CASE WHEN record_type = '会员费' THEN amount ELSE 0 END) as total_membership_income,
        SUM(CASE WHEN record_type = '私教费' THEN amount ELSE 0 END) as total_coaching_income,
        SUM(CASE WHEN record_type = '其他收入' THEN amount ELSE 0 END) as total_other_income,
        SUM(CASE WHEN record_type = '支出' THEN amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN record_type IN ('会员费', '私教费', '其他收入') THEN amount ELSE 0 END) - 
        SUM(CASE WHEN record_type = '支出' THEN amount ELSE 0 END) as total_profit
      FROM 
        financial_records
      WHERE 
        1=1
        ${whereClause}
    `;

    // 🔧 修复：使用 prisma.$queryRaw 替代 pool.query
    const totalResult = await prisma.$queryRaw<any[]>`${totalQuery}`;

    return res.status(200).json({
      code: 0,
      message: '获取财务统计成功',
      data: {
        list: result,
        total: totalResult[0], // 注意：移除 .rows，直接使用数组元素
        time_format: timeFormat,
      },
    });
  } catch (error) {
    console.error('获取财务统计失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}
