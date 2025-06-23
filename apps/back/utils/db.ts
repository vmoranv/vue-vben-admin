import process from 'node:process';

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });

// 检查必要的环境变量
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 环境变量未设置');
}

// 定义查询结果的类型接口
interface CurrentTimeResult {
  current_time: Date;
}

interface TableCountResult {
  table_count: string;
}

// 创建 Prisma Client 实例
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await prisma.$connect();

    const result = await prisma.$queryRaw<
      CurrentTimeResult[]
    >`SELECT NOW() as current_time`;
    console.warn('当前数据库时间：', result[0]?.current_time);

    const tableCount = await prisma.$queryRaw<TableCountResult[]>`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const count = Number(tableCount[0]?.table_count);
    console.warn('数据库表数量：', count);

    if (count === 0) {
      console.warn('数据库中没有表，请执行以下步骤：');
      console.warn('1. 生成客户端代码: npx prisma generate');
      console.warn('2. 推送数据库结构: npx prisma db push');
      console.warn('3. 初始化数据: pnpm run db:seed');
      console.warn('或者一键重置: pnpm run db:reset\n');
    } else {
      console.warn('数据库表结构已就绪');
    }
  } catch (error) {
    console.error('Prisma 数据库连接失败：', error);
  }
};

setTimeout(testConnection, 1000);

const gracefulShutdown = async () => {
  await prisma.$disconnect();
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);

export default prisma;
export { prisma };
