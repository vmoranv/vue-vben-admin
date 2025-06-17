import process from 'node:process';

import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import prisma from '../utils/db';

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'access_token_secret';
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret';
const ACCESS_TOKEN_EXPIRES_IN = '2h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    const userResult = await prisma.$queryRaw`
      SELECT users.*, roles.name as role_name 
      FROM users 
      JOIN roles ON users.role_id = roles.id 
      WHERE username = ${username}
    `;

    if (!userResult || (userResult as any[]).length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null,
      });
    }

    const user = (userResult as any[])[0];

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null,
      });
    }

    if (user.status !== 1) {
      return res.status(403).json({
        code: 403,
        message: '用户已被禁用',
        data: null,
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role_name },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
    );

    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    return res.status(200).json({
      code: 0,
      message: '登录成功',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          role: user.role_name,
        },
      },
    });
  } catch (error) {
    console.error('登录失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

export async function getUserInfo(req: Request, res: Response) {
  try {
    const userId = req.user?.id; // 从JWT验证中提取

    const userResult = await prisma.$queryRaw`
      SELECT users.id, users.username, users.real_name, users.email, users.phone, roles.name as role 
      FROM users 
      JOIN roles ON users.role_id = roles.id 
      WHERE users.id = ${userId}
    `;

    if (!userResult || (userResult as any[]).length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null,
      });
    }

    const user = (userResult as any[])[0];

    return res.status(200).json({
      code: 0,
      message: '获取用户信息成功',
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('获取用户信息失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}
