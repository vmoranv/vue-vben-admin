import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = 'access_token_secret';

// 扩展Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: string; username: string };
    }
  }
}

// 验证JWT中间件
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供访问令牌',
        data: null,
      });
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({
          code: 401,
          message: '访问令牌无效或已过期',
          data: null,
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('验证令牌失败：', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
    });
  }
}

// 角色验证中间件
export function checkRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: '未经身份验证',
          data: null,
        });
      }

      if (roles.includes(req.user.role)) {
        next();
      } else {
        return res.status(403).json({
          code: 403,
          message: '权限不足',
          data: null,
        });
      }
    } catch (error) {
      console.error('检查角色失败：', error);
      return res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null,
      });
    }
  };
}

// 管理员专用中间件
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  return checkRole(['admin'])(req, res, next);
}

// 教练或管理员中间件
export function coachOrAdmin(req: Request, res: Response, next: NextFunction) {
  return checkRole(['admin', 'coach'])(req, res, next);
}
