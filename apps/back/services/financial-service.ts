import { Prisma } from '@prisma/client';
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

    // 构建 WHERE 条件对象
    const whereConditions: any = {};

    if (record_type) {
      whereConditions.recordType = record_type;
    }

    if (member_id) {
      whereConditions.memberId = Number(member_id);
    }

    if (coach_id) {
      whereConditions.coachId = Number(coach_id);
    }

    if (start_date || end_date) {
      whereConditions.recordDate = {};
      if (start_date) {
        whereConditions.recordDate.gte = new Date(start_date as string);
      }
      if (end_date) {
        whereConditions.recordDate.lte = new Date(end_date as string);
      }
    }

    // 计算总记录数
    const total = await prisma.financialRecord.count({
      where: whereConditions,
    });

    // 计算分页参数
    const offset = (Number(page) - 1) * Number(pageSize);

    // 查询分页数据
    const result = await prisma.financialRecord.findMany({
      where: whereConditions,
      include: {
        member: true,
        coach: true,
        operator: true,
      },
      orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
      skip: offset,
      take: Number(pageSize),
    });

    // 格式化结果
    const formattedResult = result.map((record: any) => ({
      id: record.id,
      recordType: record.recordType,
      record_type: record.recordType,
      amount: Number.parseFloat(record.amount) || 0,
      recordDate: record.recordDate,
      record_date: record.recordDate,
      paymentMethod: record.paymentMethod || null,
      payment_method: record.paymentMethod || null,
      description: record.description,
      member_name: record.member?.name || null,
      coachId: record.coachId,
      coach_id: record.coachId,
      coach_name: record.coach?.realName || null,
      operatorId: record.operatorId,
      operator_name: record.operator?.realName || null,
      createdAt: record.createdAt,
      created_at: record.createdAt,
      updatedAt: record.updatedAt,
      updated_at: record.updatedAt,
    }));

    return res.status(200).json({
      code: 0,
      message: '获取财务记录成功',
      data: {
        items: formattedResult,
        total,
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

// 创建财务记录
export async function createFinancialRecord(req: Request, res: Response) {
  try {
    const {
      record_type,
      amount,
      record_date,
      member_id,
      coach_id,
      description,
      payment_method,
    } = req.body;

    if (!record_type || !amount || !record_date) {
      return res.status(400).json({
        code: 400,
        message: '记录类型、金额和记录日期为必填项',
        data: null,
      });
    }

    // 验证会员是否存在
    if (member_id) {
      const memberExists = await prisma.member.findUnique({
        where: { id: Number(member_id) },
      });

      if (!memberExists) {
        return res.status(400).json({
          code: 400,
          message: `会员ID ${member_id} 不存在`,
          data: null,
        });
      }
    }

    // 验证教练是否存在
    if (coach_id) {
      const coachExists = await prisma.user.findUnique({
        where: {
          id: Number(coach_id),
          role: {
            name: 'coach',
          },
        },
      });

      if (!coachExists) {
        return res.status(400).json({
          code: 400,
          message: `教练ID ${coach_id} 不存在`,
          data: null,
        });
      }
    }

    const financialRecord = await prisma.financialRecord.create({
      data: {
        recordType: record_type,
        amount: Number.parseFloat(amount),
        recordDate: new Date(record_date),
        description: description || null,
        paymentMethod: payment_method || null,
        memberId: member_id ? Number(member_id) : null,
        coachId: coach_id ? Number(coach_id) : null,
        operatorId: 1,
      },
    });

    return res.status(201).json({
      code: 0,
      message: '创建财务记录成功',
      data: financialRecord,
    });
  } catch (error) {
    console.error('创建财务记录失败：', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2003'
    ) {
      return res.status(400).json({
        code: 400,
        message: '关联的会员或教练不存在，请检查输入的ID',
        data: null,
      });
    }

    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 获取财务记录详情
export async function getFinancialRecordDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const recordId = Number.parseInt(id);

    if (Number.isNaN(recordId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的记录ID',
        data: null,
      });
    }

    const record = await prisma.financialRecord.findUnique({
      where: { id: recordId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
          },
        },
        coach: {
          select: {
            id: true,
            realName: true,
          },
        },
        operator: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({
        code: 404,
        message: '财务记录不存在',
        data: null,
      });
    }

    const formattedRecord = {
      id: record.id,
      record_type: record.recordType,
      amount: Number.parseFloat(record.amount.toString()) || 0,
      record_date: record.recordDate,
      payment_method: record.paymentMethod || null,
      description: record.description,
      member_id: record.memberId,
      member_name: record.member?.name || null,
      coach_id: record.coachId,
      coach_name: record.coach?.realName || null,
      operator_id: record.operatorId,
      operator_name: record.operator?.realName || null,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };

    return res.status(200).json({
      code: 0,
      message: '获取财务记录详情成功',
      data: formattedRecord,
    });
  } catch (error) {
    console.error('获取财务记录详情失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 更新财务记录
export async function updateFinancialRecord(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      record_type,
      amount,
      record_date,
      payment_method,
      description,
      member_id,
      coach_id,
    } = req.body;
    const recordId = Number.parseInt(id);

    if (Number.isNaN(recordId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的记录ID',
        data: null,
      });
    }

    if (!record_type || !amount || !record_date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    const existingRecord = await prisma.financialRecord.findUnique({
      where: { id: recordId },
    });

    if (!existingRecord) {
      return res.status(404).json({
        code: 404,
        message: '财务记录不存在',
        data: null,
      });
    }

    const updatedRecord = await prisma.financialRecord.update({
      where: { id: recordId },
      data: {
        recordType: record_type,
        amount: amount.toString(),
        recordDate: new Date(record_date),
        paymentMethod: payment_method || null,
        description: description || null,
        memberId: member_id || null,
        coachId: coach_id || null,
        updatedAt: new Date(),
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
          },
        },
        coach: {
          select: {
            id: true,
            realName: true,
          },
        },
        operator: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    const formattedRecord = {
      id: updatedRecord.id,
      record_type: updatedRecord.recordType,
      amount: Number.parseFloat(updatedRecord.amount.toString()) || 0,
      record_date: updatedRecord.recordDate,
      payment_method: updatedRecord.paymentMethod || null,
      description: updatedRecord.description,
      member_id: updatedRecord.memberId,
      member_name: updatedRecord.member?.name || null,
      coach_id: updatedRecord.coachId,
      coach_name: updatedRecord.coach?.realName || null,
      operator_id: updatedRecord.operatorId,
      operator_name: updatedRecord.operator?.realName || null,
      created_at: updatedRecord.createdAt,
      updated_at: updatedRecord.updatedAt,
    };

    return res.status(200).json({
      code: 0,
      message: '更新财务记录成功',
      data: formattedRecord,
    });
  } catch (error) {
    console.error('更新财务记录失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 删除财务记录
export async function deleteFinancialRecord(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const recordId = Number.parseInt(id);

    if (Number.isNaN(recordId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的记录ID',
        data: null,
      });
    }

    // 检查财务记录是否存在
    const existingRecord = await prisma.financialRecord.findUnique({
      where: { id: recordId },
    });

    if (!existingRecord) {
      return res.status(404).json({
        code: 404,
        message: '财务记录不存在',
        data: null,
      });
    }

    // 删除财务记录
    await prisma.financialRecord.delete({
      where: { id: recordId },
    });

    return res.status(200).json({
      code: 0,
      message: '删除财务记录成功',
      data: null,
    });
  } catch (error) {
    console.error('删除财务记录失败：', error);
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
    interface FinancialStatsTotal {
      total_membership_income: number;
      total_coaching_income: number;
      total_other_income: number;
      total_expense: number;
      total_profit: number;
    }

    const { time_unit, start_date, end_date } = req.query;

    let timeFormat = '';
    let groupByClause = '';

    if (time_unit === 'month') {
      timeFormat = 'YYYY-MM';
      groupByClause = `TO_CHAR(record_date, 'YYYY-MM')`;
    } else if (time_unit === 'year') {
      timeFormat = 'YYYY';
      groupByClause = `TO_CHAR(record_date, 'YYYY')`;
    } else {
      timeFormat = 'YYYY-MM-DD';
      groupByClause = `TO_CHAR(record_date, 'YYYY-MM-DD')`;
    }

    let whereCondition = Prisma.sql`WHERE 1=1`;

    if (start_date) {
      whereCondition = Prisma.sql`${whereCondition} AND record_date >= ${start_date}`;
    }

    if (end_date) {
      whereCondition = Prisma.sql`${whereCondition} AND record_date <= ${end_date}`;
    }

    const query = Prisma.sql`
      SELECT 
        ${Prisma.raw(groupByClause)} as time_period,
        SUM(CASE WHEN record_type = '会员费' THEN amount ELSE 0 END) as membership_income,
        SUM(CASE WHEN record_type = '私教费' THEN amount ELSE 0 END) as coaching_income,
        SUM(CASE WHEN record_type = '其他收入' THEN amount ELSE 0 END) as other_income,
        SUM(CASE WHEN record_type = '支出' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN record_type IN ('会员费', '私教费', '其他收入') THEN amount ELSE 0 END) - 
        SUM(CASE WHEN record_type = '支出' THEN amount ELSE 0 END) as profit
      FROM 
        financial_records
      ${whereCondition}
      GROUP BY 
        ${Prisma.raw(groupByClause)}
      ORDER BY 
        time_period
    `;

    const result = await prisma.$queryRaw(query);

    const totalQuery = Prisma.sql`
      SELECT 
        SUM(CASE WHEN record_type = '会员费' THEN amount ELSE 0 END) as total_membership_income,
        SUM(CASE WHEN record_type = '私教费' THEN amount ELSE 0 END) as total_coaching_income,
        SUM(CASE WHEN record_type = '其他收入' THEN amount ELSE 0 END) as total_other_income,
        SUM(CASE WHEN record_type = '支出' THEN amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN record_type IN ('会员费', '私教费', '其他收入') THEN amount ELSE 0 END) - 
        SUM(CASE WHEN record_type = '支出' THEN amount ELSE 0 END) as total_profit
      FROM 
        financial_records
      ${whereCondition}
    `;

    const totalResult =
      await prisma.$queryRaw<FinancialStatsTotal[]>(totalQuery);

    return res.status(200).json({
      code: 0,
      message: '获取财务统计成功',
      data: {
        list: result,
        total: totalResult[0],
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

// 添加会员费收入记录
export async function addMembershipFee(req: Request, res: Response) {
  try {
    const { member_id, amount, record_date, description, payment_method } =
      req.body;
    const operatorId = req.user?.id || 1; // 确保操作员ID有值

    if (!member_id || !amount || !record_date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

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

    const result = await prisma.$transaction(async (tx) => {
      const recordDateObj = new Date(record_date);
      const currentTime = new Date();

      // 包含所有必要字段，包括created_at和updated_at
      const financialResult = await tx.$queryRaw<any[]>`
        INSERT INTO financial_records (
          record_type, amount, member_id, record_date,
          description, payment_method, operator_id, created_at, updated_at
        ) VALUES (
          ${`会员费`}, 
          ${amount}, 
          ${member_id}, 
          ${recordDateObj}, 
          ${description || null}, 
          ${payment_method || null}, 
          ${operatorId},
          ${currentTime},
          ${currentTime}
        ) 
        RETURNING *
      `;

      const member = memberCheck[0];
      const newExpireDate = new Date(
        Math.max(new Date(member.expire_date).getTime(), Date.now()),
      );

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
  } catch (error: any) {
    console.error('添加会员费记录失败：', error);

    if (error?.code === 'P2010' && error?.meta?.code === '23502') {
      return res.status(400).json({
        code: 400,
        message: '数据完整性错误，请检查必填字段',
        data: null,
      });
    }

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
    const {
      member_id,
      coach_id,
      amount,
      record_date,
      description,
      payment_method,
    } = req.body;
    const operatorId = req.user?.id || 1; // 确保操作员ID有值

    if (!member_id || !coach_id || !amount || !record_date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

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

    // 转换日期并添加时间戳
    const recordDateObj = new Date(record_date);
    const currentTime = new Date();

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO financial_records (
        record_type, amount, member_id, coach_id,
        record_date, description, payment_method, operator_id, created_at, updated_at
      ) VALUES (
        ${`私教费`}, 
        ${amount}, 
        ${member_id}, 
        ${coach_id}, 
        ${recordDateObj}, 
        ${description}, 
        ${payment_method || null}, 
        ${operatorId},
        ${currentTime},
        ${currentTime}
      ) 
      RETURNING *
    `;

    return res.status(201).json({
      code: 0,
      message: '添加私教费记录成功',
      data: result[0],
    });
  } catch (error: any) {
    console.error('添加私教费记录失败：', error);

    // 增强错误处理
    if (error?.code === 'P2010') {
      if (error?.meta?.code === '42804') {
        return res.status(400).json({
          code: 400,
          message: '日期格式错误，请检查日期格式',
          data: null,
        });
      }
      if (error?.meta?.code === '23502') {
        return res.status(400).json({
          code: 400,
          message: '数据完整性错误，请检查必填字段',
          data: null,
        });
      }
    }

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
    const { record_type, amount, record_date, description, payment_method } =
      req.body;
    const operatorId = req.user?.id || 1; // 确保操作员ID有值

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

    // 转换日期并添加时间戳
    const recordDateObj = new Date(record_date);
    const currentTime = new Date();

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO financial_records (
        record_type, amount, record_date,
        description, payment_method, operator_id, created_at, updated_at
      ) VALUES (
        ${record_type}, 
        ${amount}, 
        ${recordDateObj}, 
        ${description}, 
        ${payment_method || null}, 
        ${operatorId},
        ${currentTime},
        ${currentTime}
      ) 
      RETURNING *
    `;

    return res.status(201).json({
      code: 0,
      message: '添加财务记录成功',
      data: result[0],
    });
  } catch (error: any) {
    console.error('添加财务记录失败：', error);

    // 增强错误处理
    if (error?.code === 'P2010') {
      if (error?.meta?.code === '42804') {
        return res.status(400).json({
          code: 400,
          message: '日期格式错误，请检查日期格式',
          data: null,
        });
      }
      if (error?.meta?.code === '23502') {
        return res.status(400).json({
          code: 400,
          message: '数据完整性错误，请检查必填字段',
          data: null,
        });
      }
    }

    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}
