-- ==========================================
-- ENUM TYPES
-- ==========================================

CREATE TYPE production_orders_status_enum AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED'
);

CREATE TYPE type_workers_enum AS ENUM (
  'PARTTIME',
  'FULLTIME'
);

CREATE TYPE user_role_enum AS ENUM (
  'SYSTEM_ADMIN',
  'ADMIN',
  'USER'
);

-- ==========================================
-- BƯỚC 0: TEAM (Phục vụ chọn team cho ca làm việc)
-- ==========================================

-- Bảng team (nhóm làm việc)
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  team_name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Bảng thành viên thuộc team
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL,
  worker_id UUID NOT NULL,
  joined_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_team_member UNIQUE (team_id, worker_id),

  CONSTRAINT fk_team_members_team
    FOREIGN KEY (team_id) REFERENCES teams(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,

  CONSTRAINT fk_team_members_worker
    FOREIGN KEY (worker_id) REFERENCES users(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- ==========================================
-- BƯỚC 1: QUẢN LÝ SẢN PHẨM & LỆNH SẢN XUẤT
-- ==========================================

-- Bảng danh mục loại thiết bị
CREATE TABLE device_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

-- Bảng lệnh sản xuất
CREATE TABLE production_orders (
  id SERIAL PRIMARY KEY,
  order_code VARCHAR(50) UNIQUE NOT NULL,
  total_quantity INTEGER NOT NULL,
  order_signed_date DATE,
  production_start_date DATE,
  completed_date DATE,
  deadline_date DATE,
  status production_orders_status_enum DEFAULT 'PENDING',
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  device_type_id INTEGER,

  CONSTRAINT fk_production_orders_device_type
    FOREIGN KEY (device_type_id) REFERENCES device_types(id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION
);

CREATE INDEX idx_production_orders_device_type_id ON production_orders(device_type_id);

-- Bảng danh mục các khâu sản xuất (Admin tự cấu hình)
CREATE TABLE stages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  description TEXT
);

-- Bảng mapping nhiều-nhiều giữa stage và loại thiết bị
CREATE TABLE stage_device_types (
  stage_id INTEGER NOT NULL,
  device_type_id INTEGER NOT NULL,

  CONSTRAINT pk_stage_device_types PRIMARY KEY (stage_id, device_type_id),

  CONSTRAINT fk_stage_device_types_stage
    FOREIGN KEY (stage_id) REFERENCES stages(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,

  CONSTRAINT fk_stage_device_types_device_type
    FOREIGN KEY (device_type_id) REFERENCES device_types(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE INDEX idx_stage_device_types_device_type_id ON stage_device_types(device_type_id);

-- Bảng mapping stage cha-con (mỗi stage con chỉ có 1 stage cha)
CREATE TABLE stage_hierarchy (
  child_stage_id INTEGER NOT NULL,
  parent_stage_id INTEGER NOT NULL,

  CONSTRAINT pk_stage_hierarchy PRIMARY KEY (child_stage_id),

  CONSTRAINT fk_stage_hierarchy_child
    FOREIGN KEY (child_stage_id) REFERENCES stages(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,

  CONSTRAINT fk_stage_hierarchy_parent
    FOREIGN KEY (parent_stage_id) REFERENCES stages(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE INDEX idx_stage_hierarchy_parent_stage_id ON stage_hierarchy(parent_stage_id);

-- ==========================================
-- BƯỚC 2: CA LÀM VIỆC
-- ==========================================

-- Bảng ca làm việc (Phục vụ chia ca và tăng ca)
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  shift_name VARCHAR(50) NOT NULL,
  start_time TIME(6),
  end_time TIME(6)
);

-- ==========================================
-- BƯỚC 3: CẤU HÌNH ĐỊNH MỨC & PHÂN BỔ NHÂN SỰ
-- ==========================================

-- Bảng cấu hình định mức công việc (Admin cấu hình số lượng làm việc)
CREATE TABLE stage_workload_configs (
  id SERIAL PRIMARY KEY,
  stage_id INTEGER NOT NULL,
  num_workers INTEGER NOT NULL,
  target_quantity INTEGER NOT NULL,
  time_hours DOUBLE PRECISION NOT NULL,

  CONSTRAINT fk_stage_workload_stage
    FOREIGN KEY (stage_id) REFERENCES stages(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- Bảng danh sách nhân viên
CREATE TABLE users (
  id UUID PRIMARY KEY,
  worker_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  type type_workers_enum,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  role user_role_enum DEFAULT 'USER'
);

-- Bảng phân công nhân sự vào khâu làm việc theo ngày/ca
CREATE TABLE work_assignments (
  id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  shift_id INTEGER NOT NULL,
  worker_id UUID NOT NULL,
  work_date DATE NOT NULL,

  CONSTRAINT unique_worker_shift UNIQUE (worker_id, work_date, shift_id),

  CONSTRAINT fk_wa_production_order
    FOREIGN KEY (production_order_id) REFERENCES production_orders(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,

  CONSTRAINT fk_wa_stage
    FOREIGN KEY (stage_id) REFERENCES stages(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,

  CONSTRAINT fk_wa_shift
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,

  CONSTRAINT fk_wa_worker
    FOREIGN KEY (worker_id) REFERENCES users(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- ==========================================
-- BƯỚC 4: NHẬT KÝ THỐNG KÊ SẢN XUẤT
-- ==========================================

CREATE TABLE production_logs (
  id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  shift_id INTEGER NOT NULL,
  log_date DATE NOT NULL,
  actual_quantity INTEGER NOT NULL DEFAULT 0,
  defective_quantity INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_production_log_stage UNIQUE (
    production_order_id,
    stage_id,
    shift_id,
    log_date
  ),

  CONSTRAINT fk_pl_production_order
    FOREIGN KEY (production_order_id) REFERENCES production_orders(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,

  CONSTRAINT fk_pl_shift
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,

  CONSTRAINT fk_pl_stage
    FOREIGN KEY (stage_id) REFERENCES stages(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);
