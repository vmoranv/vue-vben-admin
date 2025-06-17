-- 角色表
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  role_id INT REFERENCES roles(id),
  status SMALLINT DEFAULT 1, -- 0: 禁用, 1: 启用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 会员表
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(10),
  birth_date DATE,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  join_date DATE NOT NULL,
  expire_date DATE NOT NULL,
  membership_type VARCHAR(50) NOT NULL,
  coach_id INT REFERENCES users(id), -- 绑定私教
  status SMALLINT DEFAULT 1, -- 0: 禁用, 1: 启用
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 设备表
CREATE TABLE equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  purchase_date DATE,
  price DECIMAL(10, 2),
  status SMALLINT DEFAULT 1, -- 0: 报废, 1: 正常, 2: 维修中
  warranty_expire DATE,
  location VARCHAR(100),
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 设备维护记录表
CREATE TABLE equipment_maintenance (
  id SERIAL PRIMARY KEY,
  equipment_id INT REFERENCES equipment(id),
  maintenance_type VARCHAR(50) NOT NULL, -- 保养、维修
  maintenance_date DATE NOT NULL,
  cost DECIMAL(10, 2),
  operator_id INT REFERENCES users(id),
  status SMALLINT DEFAULT 1, -- 0: 未完成, 1: 已完成
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 课程表
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  coach_id INT REFERENCES users(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  capacity INT NOT NULL,
  current_participants INT DEFAULT 0,
  location VARCHAR(100),
  course_type VARCHAR(50),
  price DECIMAL(10, 2),
  status SMALLINT DEFAULT 1, -- 0: 已取消, 1: 正常
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 会员课程预约表
CREATE TABLE course_bookings (
  id SERIAL PRIMARY KEY,
  member_id INT REFERENCES members(id),
  course_id INT REFERENCES courses(id),
  booking_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status SMALLINT DEFAULT 1, -- 0: 已取消, 1: 已预约, 2: 已签到
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, course_id)
);

-- 签到记录表
CREATE TABLE check_ins (
  id SERIAL PRIMARY KEY,
  member_id INT REFERENCES members(id),
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  check_out_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 财务记录表
CREATE TABLE financial_records (
  id SERIAL PRIMARY KEY,
  record_type VARCHAR(50) NOT NULL, -- 会员费、私教费、其他收入、支出
  amount DECIMAL(10, 2) NOT NULL,
  member_id INT REFERENCES members(id),
  coach_id INT REFERENCES users(id),
  record_date DATE NOT NULL,
  description TEXT,
  operator_id INT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 初始化角色数据
INSERT INTO roles (name, description) VALUES 
('admin', '管理员，拥有所有权限'),
('coach', '教练，管理课程和学员'),
('reception', '前台，基础操作权限');

-- 初始化管理员账号
INSERT INTO users (username, password, real_name, role_id) VALUES 
('admin', '$2a$10$X7tHMjZiHdrwjbZZ0nvTyOLpQ.1z8g/hGVIYqyavzIbvB9Bhu3zMi', '管理员', 1);  -- 密码: 123456 