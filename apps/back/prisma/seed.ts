import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 创建角色
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: '管理员，拥有所有权限',
      },
    }),
    prisma.role.upsert({
      where: { name: 'coach' },
      update: {},
      create: {
        name: 'coach',
        description: '教练，管理课程和学员',
      },
    }),
    prisma.role.upsert({
      where: { name: 'reception' },
      update: {},
      create: {
        name: 'reception',
        description: '前台，基础操作权限',
      },
    }),
  ]);

  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      status: 1,
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      realName: '管理员',
      roleId: roles[0].id,
      status: 1,
    },
  });

  // 创建备用管理员账号
  const backupAdminUser = await prisma.user.upsert({
    where: { username: 'admin_backup' },
    update: {
      status: 1,
    },
    create: {
      username: 'admin_backup',
      password: hashedPassword,
      realName: '备用管理员',
      roleId: roles[0].id,
      status: 1,
    },
  });

  console.warn('数据库初始化完成');
  console.warn('角色数量:', roles.length);
  console.warn('主管理员用户:', adminUser.username);
  console.warn('备用管理员用户:', backupAdminUser.username);
}

main()
  .catch((error) => {
    console.error(error);
    throw new Error(`数据库初始化失败: ${error.message}`);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
