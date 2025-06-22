import { Request, Response } from 'express';

import prisma from '../utils/db';

// 获取员工列表
export async function getStaffList(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 10, name, role, status } = req.query;

    const whereConditions = ["r.name != 'member'"];
    const queryParams: any[] = [];

    if (name) {
      whereConditions.push('(u.real_name ILIKE $1 OR u.username ILIKE $1)');
      queryParams.push(`%${name}%`);
    }

    if (role) {
      const roleIndex = queryParams.length + 1;
      whereConditions.push(`r.name = $${roleIndex}`);
      queryParams.push(role);
    }

    if (status !== undefined && status !== '') {
      const statusIndex = queryParams.length + 1;
      const statusValue = status === 'active' ? 1 : 0;
      whereConditions.push(`u.status = $${statusIndex}`);
      queryParams.push(statusValue);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const countQuery = `
      SELECT COUNT(*) as count 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      ${whereClause}
    `;
    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      countQuery,
      ...queryParams,
    );
    const total = Number(countResult[0].count);

    const offset = (Number(page) - 1) * Number(pageSize);
    const limitIndex = queryParams.length + 1;
    const offsetIndex = queryParams.length + 2;

    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.real_name, 
        u.phone, 
        u.email, 
        r.name as role, 
        u.status,
        u.created_at, 
        u.updated_at
      FROM 
        users u
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const result = await prisma.$queryRawUnsafe<any[]>(
      query,
      ...queryParams,
      Number(pageSize),
      offset,
    );

    const formattedResult = result.map((item) => ({
      ...item,
      name: item.real_name,
      status: item.status === 1 ? 'active' : 'inactive',
    }));

    return res.status(200).json({
      code: 0,
      message: '获取员工列表成功',
      data: {
        list: formattedResult,
        pagination: {
          current: Number(page),
          pageSize: Number(pageSize),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取员工列表失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 添加员工
export async function addStaff(req: Request, res: Response) {
  try {
    const { name, username, password, real_name, phone, email, role, status } =
      req.body;

    const finalRealName = real_name || name;

    if (!username || !password || !finalRealName || !role) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数',
        data: null,
      });
    }

    const userCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (userCheck.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在',
        data: null,
      });
    }

    const roleResult = await prisma.$queryRaw<any[]>`
      SELECT id FROM roles WHERE name = ${role}
    `;

    if (roleResult.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '角色不存在',
        data: null,
      });
    }

    const roleId = roleResult[0].id;

    const statusValue = status === 'active' ? 1 : status === 'inactive' ? 0 : 1;

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO users (
        username, password, real_name, phone, email, role_id, status
      ) VALUES (
        ${username}, ${password}, ${finalRealName}, ${phone || null}, ${email || null}, ${roleId}, ${statusValue}
      ) 
      RETURNING id, username, real_name, phone, email, role_id, status, created_at
    `;

    const roleInfo = await prisma.$queryRaw<any[]>`
      SELECT name FROM roles WHERE id = ${roleId}
    `;

    const responseData = {
      ...result[0],
      name: result[0].real_name,
      role: roleInfo[0].name,
      status: result[0].status === 1 ? 'active' : 'inactive',
    };

    return res.status(201).json({
      code: 0,
      message: '添加员工成功',
      data: responseData,
    });
  } catch (error) {
    console.error('添加员工失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 更新员工信息
export async function updateStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      real_name,
      phone,
      email,
      role,
      status,
      password,
    } = req.body;

    const finalRealName = real_name || name;

    const staffCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM users WHERE id = ${Number(id)}
    `;

    if (staffCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '员工不存在',
        data: null,
      });
    }

    let roleId = null;
    if (role) {
      const roleResult = await prisma.$queryRaw<any[]>`
        SELECT id FROM roles WHERE name = ${role}
      `;

      if (roleResult.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '角色不存在',
          data: null,
        });
      }
      roleId = roleResult[0].id;
    }

    let statusValue = null;
    if (status !== undefined) {
      statusValue = status === 'active' ? 1 : 0;
    }

    let updateQuery;
    let queryParams;

    if (password && password.trim() !== '') {
      updateQuery = `
        UPDATE users
        SET 
          real_name = COALESCE($1, real_name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          role_id = COALESCE($4, role_id),
          status = COALESCE($5, status),
          password = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, username, real_name, phone, email, role_id, status, updated_at
      `;
      queryParams = [
        finalRealName,
        phone,
        email,
        roleId,
        statusValue,
        password,
        Number(id),
      ];
    } else {
      // 如果没有密码，不更新密码字段
      updateQuery = `
        UPDATE users
        SET 
          real_name = COALESCE($1, real_name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          role_id = COALESCE($4, role_id),
          status = COALESCE($5, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, username, real_name, phone, email, role_id, status, updated_at
      `;
      queryParams = [
        finalRealName,
        phone,
        email,
        roleId,
        statusValue,
        Number(id),
      ];
    }

    const result = await prisma.$queryRawUnsafe<any[]>(
      updateQuery,
      ...queryParams,
    );

    const roleInfo = await prisma.$queryRaw<any[]>`
      SELECT name FROM roles WHERE id = ${result[0].role_id}
    `;

    const responseData = {
      ...result[0],
      name: result[0].real_name,
      role: roleInfo[0].name,
      status: result[0].status === 1 ? 'active' : 'inactive',
    };

    return res.status(200).json({
      code: 0,
      message: '更新员工信息成功',
      data: responseData,
    });
  } catch (error) {
    console.error('更新员工信息失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 删除员工
export async function deleteStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const staffCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM users WHERE id = ${Number(id)}
    `;

    if (staffCheck.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '员工不存在',
        data: null,
      });
    }

    await prisma.$queryRaw`
      UPDATE users SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ${Number(id)}
    `;

    return res.status(200).json({
      code: 0,
      message: '删除员工成功',
      data: null,
    });
  } catch (error) {
    console.error('删除员工失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 获取员工详情
export async function getStaffDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        code: 400,
        message: '无效的员工ID',
        data: null,
      });
    }

    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.real_name, 
        u.phone, 
        u.email, 
        r.name as role, 
        u.status,
        u.created_at, 
        u.updated_at
      FROM 
        users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `;

    const result = await prisma.$queryRawUnsafe<any[]>(query, Number(id));

    if (result.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '员工不存在或已被删除',
        data: null,
      });
    }

    const formattedResult = {
      ...result[0],
      name: result[0].real_name || '',
      status: result[0].status === 1 ? 'active' : 'inactive',
      avatar: result[0].avatar || '',
      phone: result[0].phone || '',
      email: result[0].email || '',
    };

    return res.status(200).json({
      code: 0,
      message: '获取员工详情成功',
      data: formattedResult,
    });
  } catch (error) {
    console.error('获取员工详情失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}
