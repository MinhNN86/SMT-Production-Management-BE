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
  total_quantity INT NOT NULL, -- Tổng số lượng thiết bị cần sản xuất
  start_date DATE, -- Ngày bắt đầu sản xuất
  completion_date DATE, -- Ngày hoàn thành
  delivery_date DATE, -- Ngày cần bàn giao
  device_type_id INT,
  status production_orders_status_enum DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_production_orders_device_type
    FOREIGN KEY (device_type_id) REFERENCES device_types(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_production_orders_device_type_id ON production_orders(device_type_id);

-- Bảng danh mục các khâu sản xuất (Admin tự cấu hình)
CREATE TABLE stages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL, -- Lắp ráp mib, lắp ráp mob, test, đóng nắp...
  display_order INT NOT NULL DEFAULT 0,
  description TEXT
);

-- Bảng mapping stage cha-con (mỗi stage con chỉ có 1 stage cha)
CREATE TABLE stage_hierarchy (
  child_stage_id INT PRIMARY KEY,
  parent_stage_id INT NOT NULL,

  CONSTRAINT chk_stage_hierarchy_no_self
    CHECK (child_stage_id <> parent_stage_id),

  CONSTRAINT fk_stage_hierarchy_child
    FOREIGN KEY (child_stage_id) REFERENCES stages(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_stage_hierarchy_parent
    FOREIGN KEY (parent_stage_id) REFERENCES stages(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_stage_hierarchy_parent_stage_id ON stage_hierarchy(parent_stage_id);

-- Bảng mapping nhiều-nhiều giữa stage và loại thiết bị
CREATE TABLE stage_device_types (
  stage_id INT NOT NULL,
  device_type_id INT NOT NULL,

  CONSTRAINT pk_stage_device_types PRIMARY KEY (stage_id, device_type_id),

  CONSTRAINT fk_stage_device_types_stage
    FOREIGN KEY (stage_id) REFERENCES stages(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_stage_device_types_device_type
    FOREIGN KEY (device_type_id) REFERENCES device_types(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_stage_device_types_device_type_id ON stage_device_types(device_type_id);

-- ==========================================
-- BƯỚC 2: CA LÀM VIỆC
-- ==========================================

-- Bảng ca làm việc (Phục vụ chia ca và tăng ca)
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  shift_name VARCHAR(50) NOT NULL,
  start_time TIME,
  end_time TIME
);

-- ==========================================
-- BƯỚC 3: CẤU HÌNH ĐỊNH MỨC & PHÂN BỔ NHÂN SỰ
-- ==========================================

-- Bảng cấu hình định mức công việc (Admin cấu hình số lượng làm việc)
CREATE TABLE stage_workload_configs (
  id SERIAL PRIMARY KEY,
  stage_id INT NOT NULL,
  num_workers INT NOT NULL,
  target_quantity INT NOT NULL, -- Số lượng bộ/sản phẩm tương ứng
  time_hours DOUBLE PRECISION NOT NULL, -- Thời gian làm việc (giờ)
  CONSTRAINT fk_stage_workload_stage
    FOREIGN KEY (stage_id) REFERENCES stages(id)
);

-- Bảng danh sách nhân viên
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  type type_workers_enum,
  email VARCHAR(255) UNIQUE,           -- Email đăng nhập (có thể NULL nếu worker không cần login)
  password VARCHAR(255),               -- Mật khẩu đã mã hóa bcrypt
  role user_role_enum DEFAULT 'USER'   -- Phân quyền: ADMIN hoặc USER
);

-- Bảng thành viên thuộc team
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL,
  worker_id UUID NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_team_member UNIQUE (team_id, worker_id),

  CONSTRAINT fk_team_members_team
    FOREIGN KEY (team_id) REFERENCES teams(id),

  CONSTRAINT fk_team_members_worker
    FOREIGN KEY (worker_id) REFERENCES users(id)
);

-- Bảng phân công nhân sự vào khâu làm việc theo ngày/ca
CREATE TABLE work_assignments (
  id SERIAL PRIMARY KEY,
  production_order_id INT NOT NULL,
  stage_id INT NOT NULL,
  shift_id INT NOT NULL,
  worker_id UUID NOT NULL,
  work_date DATE NOT NULL,

  -- Đảm bảo 1 công nhân 1 ca chỉ làm 1 việc
  CONSTRAINT unique_worker_shift UNIQUE (worker_id, work_date, shift_id),

  CONSTRAINT fk_wa_production_order
    FOREIGN KEY (production_order_id) REFERENCES production_orders(id),

  CONSTRAINT fk_wa_stage
    FOREIGN KEY (stage_id) REFERENCES stages(id),

  CONSTRAINT fk_wa_shift
    FOREIGN KEY (shift_id) REFERENCES shifts(id),

  CONSTRAINT fk_wa_worker
    FOREIGN KEY (worker_id) REFERENCES users(id)
);

-- ==========================================
-- BƯỚC 4: NHẬT KÝ THỐNG KÊ SẢN XUẤT
-- ==========================================

CREATE TABLE production_logs (
  id SERIAL PRIMARY KEY,
  production_order_id INT NOT NULL,
  stage_id INT NOT NULL,
  shift_id INT NOT NULL,
  log_date DATE NOT NULL,
  actual_quantity INT NOT NULL DEFAULT 0, -- Số lượng làm được thực tế trong ca
  defective_quantity INT NOT NULL DEFAULT 0, -- Số lượng hàng lỗi
  note TEXT, -- Ghi chú
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 1 ca của 1 ngày ở 1 khâu chỉ có 1 record tổng kết
  CONSTRAINT unique_production_log UNIQUE (
    production_order_id,
    stage_id,
    shift_id,
    log_date
  ),

  CONSTRAINT fk_pl_production_order
    FOREIGN KEY (production_order_id) REFERENCES production_orders(id),

  CONSTRAINT fk_pl_stage
    FOREIGN KEY (stage_id) REFERENCES stages(id),

  CONSTRAINT fk_pl_shift
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
);