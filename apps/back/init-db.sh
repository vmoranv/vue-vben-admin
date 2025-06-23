#!/bin/bash

# 检查 POSTGRES_URL 环境变量
if [ -z "$POSTGRES_URL" ]; then
    echo "错误: 未设置 POSTGRES_URL 环境变量"
    echo "请在 .env.development.local 文件中设置 POSTGRES_URL"
    exit 1
fi

# 从环境变量加载数据库连接信息
source .env.development.local

echo "初始化数据库..."
psql "$POSTGRES_URL" -f ./database/init.sql

echo "数据库初始化完成!" 