import process from 'node:process';

import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });

export const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access_token_secret',
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret',
  ACCESS_TOKEN_EXPIRES_IN: '2h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
};
