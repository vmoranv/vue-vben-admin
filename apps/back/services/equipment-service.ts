import { Request, Response } from 'express';

import prisma from '../utils/db';

// 获取设备列表
export async function getEquipmentList(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 10, name, type, status } = req.query;

    // 构建查询条件对象
    const whereConditions: any = {};
    
    if (name) {
      whereConditions.name = {
        contains: name as string,
        mode: 'insensitive',
      };
    }

    if (type) {
      whereConditions.type = type as string;
    }

    if (status !== undefined && status !== '') {
      whereConditions.status = Number(status);
    }

    // 计算总记录数
    const total = await prisma.equipment.count({
      where: whereConditions,
    });

    // 查询分页数据
    const offset = (Number(page) - 1) * Number(pageSize);
    
    const result = await prisma.equipment.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc',
      },
      take: Number(pageSize),
      skip: offset,
    });

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
      status = 1,
      model,
      purchaseDate,
      price,
      warrantyExpire,
      location,
      remark,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    const result = await prisma.equipment.create({
      data: {
        name,
        type,
        status,
        model,
        purchaseDate: purchaseDate,
        price: price ? Number(price) : null,
        warrantyExpire: warrantyExpire,
        location,
        remark,
      },
    });

    return res.status(201).json({
      code: 0,
      message: '添加设备成功',
      data: result,
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

// 更新设备信息
export async function updateEquipment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      status,
      model,
      purchaseDate,
      price,
      warrantyExpire,
      location,
      remark,
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        code: 400,
        message: '无效的设备ID',
        data: null,
      });
    }

    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: Number(id) },
    });

    if (!existingEquipment) {
      return res.status(404).json({
        code: 404,
        message: '设备不存在',
        data: null,
      });
    }

    const result = await prisma.equipment.update({
      where: { id: Number(id) },
      data: {
        name,
        type,
        status,
        model,
        purchaseDate: purchaseDate,
        price: price ? Number(price) : null,
        warrantyExpire: warrantyExpire,
        location,
        remark,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      code: 0,
      message: '更新设备成功',
      data: result,
    });
  } catch (error) {
    console.error('更新设备失败：', error);
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

    const operatorId = req.user?.id || 1;

    if (!equipment_id || !maintenance_type || !maintenance_date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

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
      ) VALUES (
        ${Number(equipment_id)}, 
        ${maintenance_type}, 
        ${maintenance_date}::date, 
        ${cost}, 
        ${operatorId}, 
        ${description}
      ) 
      RETURNING *
    `;

    if (maintenance_type === '故障维修') {
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

// 获取设备详情
export async function getEquipmentDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        code: 400,
        message: '无效的设备ID',
        data: null,
      });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: Number(id) },
    });

    if (!equipment) {
      return res.status(404).json({
        code: 404,
        message: '设备不存在',
        data: null,
      });
    }

    return res.status(200).json({
      code: 0,
      message: '获取设备详情成功',
      data: equipment,
    });
  } catch (error) {
    console.error('获取设备详情失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 删除设备
export async function deleteEquipment(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // 验证ID参数
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        code: 400,
        message: '无效的设备ID',
        data: null,
      });
    }

    // 检查设备是否存在
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: Number(id) },
    });

    if (!existingEquipment) {
      return res.status(404).json({
        code: 404,
        message: '设备不存在',
        data: null,
      });
    }

    // 删除设备
    await prisma.equipment.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({
      code: 0,
      message: '删除设备成功',
      data: null,
    });
  } catch (error) {
    console.error('删除设备失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}
