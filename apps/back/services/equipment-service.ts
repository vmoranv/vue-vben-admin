import { Request, Response } from 'express';

import prisma from '../utils/db';

// 获取设备列表
export async function getEquipmentList(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 10, name, type, status } = req.query;

    // 构建查询条件
    const queryParams: any[] = [];
    const conditions = [];
    let paramIndex = 1;

    if (name) {
      conditions.push(`name ILIKE $${paramIndex}`);
      queryParams.push(`%${name}%`);
      paramIndex++;
    }

    if (type) {
      conditions.push(`type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }

    if (status !== undefined && status !== '') {
      conditions.push(`status = $${paramIndex}`);
      queryParams.push(Number(status));
      paramIndex++;
    }

    // 构建WHERE子句
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 计算总记录数
    const _countQuery = `SELECT COUNT(*) as count FROM equipment ${whereClause}`;
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM equipment ${whereClause ? prisma.$queryRawUnsafe(`WHERE ${conditions.join(' AND ')}`, ...queryParams) : prisma.$queryRawUnsafe('')}
    `;
    const total = Number(countResult[0].count);

    // 查询分页数据
    const offset = (Number(page) - 1) * Number(pageSize);
    const paginationParams = [...queryParams, Number(pageSize), offset];

    const query = `
      SELECT *
      FROM equipment
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = (await prisma.$queryRawUnsafe(
      query,
      ...paginationParams,
    )) as any[];

    return res.status(200).json({
      code: 0,
      message: '获取设备列表成功',
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
    console.error('获取设备列表失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 添加设备
export async function createEquipment(req: Request, res: Response) {
  try {
    const {
      name,
      type,
      model,
      purchase_date,
      price,
      warranty_expire,
      location,
      remark,
    } = req.body;

    // 验证必要字段
    if (!name || !type) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO equipment (
        name, type, model, purchase_date, price, 
        warranty_expire, location, remark
      ) VALUES (${name}, ${type}, ${model}, ${purchase_date}, ${price}, ${warranty_expire}, ${location}, ${remark}) 
      RETURNING *
    `;

    return res.status(201).json({
      code: 0,
      message: '添加设备成功',
      data: result[0],
    });
  } catch (error) {
    console.error('添加设备失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 更新设备状态
export async function updateEquipmentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证参数
    if (status === undefined || ![0, 1, 2].includes(Number(status))) {
      return res.status(400).json({
        code: 400,
        message: '无效的设备状态',
        data: null,
      });
    }

    // 检查设备是否存在
    const existingEquipment = await prisma.$queryRaw<any[]>`
      SELECT id FROM equipment WHERE id = ${Number(id)}
    `;

    if (existingEquipment.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '设备不存在',
        data: null,
      });
    }

    const result = await prisma.$queryRaw<any[]>`
      UPDATE equipment SET
        status = ${Number(status)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)} RETURNING *
    `;

    return res.status(200).json({
      code: 0,
      message: '更新设备状态成功',
      data: result[0],
    });
  } catch (error) {
    console.error('更新设备状态失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 添加设备维护记录
export async function addMaintenanceRecord(req: Request, res: Response) {
  try {
    const {
      equipment_id,
      maintenance_type,
      maintenance_date,
      cost,
      description,
    } = req.body;

    const operatorId = req.user?.id; // 从JWT验证中提取

    // 验证必要字段
    if (!equipment_id || !maintenance_type || !maintenance_date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    // 检查设备是否存在
    const equipmentCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM equipment WHERE id = ${Number(equipment_id)}
    `;

    if (equipmentCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '设备不存在',
        data: null,
      });
    }

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO equipment_maintenance (
        equipment_id, maintenance_type, maintenance_date,
        cost, operator_id, description
      ) VALUES (${Number(equipment_id)}, ${maintenance_type}, ${maintenance_date}, ${cost}, ${operatorId}, ${description}) 
      RETURNING *
    `;

    // 如果是维修记录，更新设备状态为维修中
    if (maintenance_type === '维修') {
      await prisma.$queryRaw`
        UPDATE equipment SET status = 2 WHERE id = ${Number(equipment_id)}
      `;
    }

    return res.status(201).json({
      code: 0,
      message: '添加维护记录成功',
      data: result[0],
    });
  } catch (error) {
    console.error('添加维护记录失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 获取维护记录列表
export async function getMaintenanceRecords(req: Request, res: Response) {
  try {
    const { equipment_id } = req.params;

    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        m.*,
        e.name as equipment_name,
        u.real_name as operator_name
      FROM 
        equipment_maintenance m
      JOIN 
        equipment e ON m.equipment_id = e.id
      LEFT JOIN 
        users u ON m.operator_id = u.id
      WHERE 
        m.equipment_id = ${Number(equipment_id)}
      ORDER BY 
        m.maintenance_date DESC
    `;

    return res.status(200).json({
      code: 0,
      message: '获取维护记录成功',
      data: result,
    });
  } catch (error) {
    console.error('获取维护记录失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}
