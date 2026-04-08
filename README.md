# SMATEC Production Management API

Hệ thống quản lý sản xuất SMT - Backend API.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **ORM:** Prisma 7 (với @prisma/adapter-pg)
- **Database:** PostgreSQL 16

## Cài đặt & Chạy

```bash
# 1. Khởi chạy PostgreSQL bằng Docker
docker compose up -d

# 2. Cài đặt dependencies
npm install

# 3. Khởi tạo database (chạy init.sql)
docker exec -i production_postgres psql -U admin -d production_management_db < init.sql

# 3.1 Nếu database đã tồn tại, chạy migration bổ sung
docker exec -i production_postgres psql -U admin -d production_management_db < prisma/migrations/20260330_add_device_types_and_relations.sql
docker exec -i production_postgres psql -U admin -d production_management_db < prisma/migrations/20260402_stage_hierarchy_and_stage_device_types/migration.sql
docker exec -i production_postgres psql -U admin -d production_management_db < prisma/migrations/20260406_add_start_and_completion_date/migration.sql
docker exec -i production_postgres psql -U admin -d production_management_db < prisma/migrations/20260406_rename_workers_to_users/migration.sql

# 4. Generate Prisma Client
npx prisma generate

# 5. Chạy server (development mode, hot-reload)
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`.

## Cấu trúc thư mục

```
src/
├── config/
│   └── prisma.ts              # Singleton PrismaClient
├── controllers/               # Xử lý request/response
│   ├── productionOrder.controller.ts
│   ├── deviceType.controller.ts
│   ├── stage.controller.ts
│   ├── shift.controller.ts
│   ├── team.controller.ts
│   ├── user.controller.ts
│   ├── workloadConfig.controller.ts
│   ├── workAssignment.controller.ts
│   ├── productionLog.controller.ts
│   └── statistics.controller.ts
├── services/                  # Business logic
│   ├── productionOrder.service.ts
│   ├── deviceType.service.ts
│   ├── stage.service.ts
│   ├── shift.service.ts
│   ├── team.service.ts
│   ├── user.service.ts
│   ├── workloadConfig.service.ts
│   ├── workAssignment.service.ts  # ⚠️ Validation >= 3 workers
│   ├── productionLog.service.ts
│   └── statistics.service.ts
├── routes/                    # Định nghĩa endpoints
│   ├── productionOrder.routes.ts
│   ├── deviceType.routes.ts
│   ├── stage.routes.ts
│   ├── shift.routes.ts
│   ├── team.routes.ts
│   ├── user.routes.ts
│   ├── workloadConfig.routes.ts
│   ├── workAssignment.routes.ts
│   ├── productionLog.routes.ts
│   └── statistics.routes.ts
└── index.ts                   # Entry point
```

## API Endpoints

### Authentication

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập, nhận JWT token |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |
| PUT | `/api/auth/change-password` | Đổi mật khẩu |

**Đổi mật khẩu:**
- **User đổi mật khẩu của chính mình:**
  ```json
  {
    "oldPassword": "matkhau_cu",
    "newPassword": "matkhau_moi"
  }
  ```
- **Admin đổi mật khẩu của user khác:**
  ```json
  {
    "userId": 5,
    "newPassword": "matkhau_moi"
  }
  ```

### B1: Lệnh sản xuất & Khâu sản xuất

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/production-orders` | Tạo lệnh sản xuất mới |
| GET | `/api/production-orders` | Danh sách lệnh sản xuất |
| GET | `/api/production-orders/:id` | Chi tiết lệnh sản xuất |
| PUT | `/api/production-orders/:id` | Cập nhật lệnh sản xuất |
| DELETE | `/api/production-orders/:id` | Xóa lệnh sản xuất |
| POST | `/api/device-types` | Tạo loại thiết bị |
| GET | `/api/device-types` | Danh sách loại thiết bị |
| GET | `/api/device-types/:id` | Chi tiết loại thiết bị |
| PUT | `/api/device-types/:id` | Cập nhật loại thiết bị |
| DELETE | `/api/device-types/:id` | Xóa loại thiết bị |
| POST | `/api/stages` | Tạo khâu sản xuất |
| GET | `/api/stages` | Danh sách khâu sản xuất |
| GET | `/api/stages?tree=true` | Cây khâu sản xuất cha-con + cấu hình tự tính stage cha |
| GET | `/api/stages/:id` | Chi tiết khâu sản xuất |
| PUT | `/api/stages/:id` | Cập nhật khâu sản xuất |
| DELETE | `/api/stages/:id` | Xóa khâu sản xuất |

Lưu ý trường liên kết loại thiết bị & ngày tháng:
- `POST/PUT /api/production-orders` hỗ trợ `deviceTypeId` (có thể `null`), `startDate` (ngày bắt đầu sản xuất), `completionDate` (ngày hoàn thành), và `deliveryDate` (ngày cần bàn giao).
- `POST/PUT /api/stages` hỗ trợ `deviceTypeIds` (mảng ID) và vẫn tương thích ngược với `deviceTypeId`.

### B2: Phân phối nhân sự & Cấu hình định mức

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/workload-configs` | Tạo cấu hình định mức |
| GET | `/api/workload-configs` | Danh sách cấu hình |
| GET | `/api/workload-configs/:id` | Chi tiết cấu hình |
| PUT | `/api/workload-configs/:id` | Cập nhật cấu hình |
| DELETE | `/api/workload-configs/:id` | Xóa cấu hình |
| POST | `/api/work-assignments` | Tạo phân công theo mảng `workerIds` ⚠️ |
| PUT | `/api/work-assignments` | Cập nhật trực tiếp danh sách `workerIds` |
| GET | `/api/work-assignments` | Danh sách phân công |
| DELETE | `/api/work-assignments/:id` | Xóa phân công |

> ⚠️ **POST `/api/work-assignments`** sẽ trả về `warning` nếu tổng worker trong 1 khâu/1 ca/1 ngày < 3 người.

### Mô hình stage cha - stage con

- Quan hệ stage cha-con được lưu tại bảng `stage_hierarchy`.
- Khi gọi `GET /api/stages?tree=true`, mỗi stage cha có thêm `children` và `autoCalculatedConfigs`.
- `autoCalculatedConfigs.targetQuantity` của stage cha được tính tự động từ các stage con theo công đoạn chậm nhất (lấy giá trị nhỏ nhất theo từng cặp `numWorkers + timeHours`).
- API cấu hình định mức (`/api/workload-configs`) vẫn dùng như cũ, chỉ cần truyền `stageId` là stage con; response sẽ kèm thêm `parentAutoCalculated` nếu stage đó có cha.

### B3: Nhập báo cáo

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/production-logs` | Nhập/cập nhật báo cáo (upsert) |
| GET | `/api/production-logs` | Danh sách báo cáo |

### B4: Thống kê sản lượng

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/statistics?productionOrderId=1&date=2026-03-25` | Thống kê sản lượng |

**Response mẫu B4:**
```json
{
  "data": {
    "productionOrderId": 1,
    "orderCode": "LSX-001",
    "productName": "Sản phẩm A",
    "totalQuantity": 1000,
    "date": "2026-03-25",
    "lastStage": { "stageId": 4, "stageName": "Đóng nắp" },
    "completed": {
      "Ca 1": 120,
      "Ca 2": 130,
      "Ca 3": 50,
      "total_day_2_shifts": 250,
      "total_day_3_shifts": 300
    },
    "cumulativeCompleted": 300,
    "remaining": 700
  }
}
```

### Danh mục Team

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/teams` | Tạo team mới (`teamName`, `description?`) |
| GET | `/api/teams` | Danh sách team |
| GET | `/api/teams/:id` | Chi tiết team |
| PUT | `/api/teams/:id` | Cập nhật team (`teamName?`, `description?`) |
| DELETE | `/api/teams/:id` | Xóa team |

### Team members

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/teams/:id/members` | Thêm danh sách worker vào team (`workerIds`) |
| PUT | `/api/teams/:id/members` | Cập nhật trực tiếp danh sách worker của team (`workerIds`) |
| GET | `/api/teams/:id/members` | Danh sách member của team |
| DELETE | `/api/teams/:id/members/:workerId` | Xóa 1 worker khỏi team |

### API phụ trợ

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| CRUD | `/api/shifts` | Ca làm việc |
| CRUD | `/api/teams` | Team |
| CRUD | `/api/users` | Nhân viên |
| GET | `/api/health` | Health check |
