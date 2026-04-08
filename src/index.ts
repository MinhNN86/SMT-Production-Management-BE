/**
 * Entry Point - Khởi tạo Express Server
 * Cấu hình middleware, đăng ký routes, và khởi chạy server.
 *
 * Tất cả API yêu cầu JWT token, trừ /api/auth/login.
 * USER chỉ được GET, ADMIN được full quyền.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";

// Import middleware xác thực
import { authenticate, authorizeRole } from "./middleware/auth.middleware.js";

// Import middleware logging
import { requestLogger, errorLogger } from "./middleware/logging.middleware.js";

// Import logger
import { logger } from "./utils/logger.util.js";

// Import các routes
import authRoutes from "./routes/auth.routes.js";
import productionOrderRoutes from "./routes/productionOrder.routes.js";
import stageRoutes from "./routes/stage.routes.js";
import shiftRoutes from "./routes/shift.routes.js";
import userRoutes from "./routes/user.routes.js";
import workloadConfigRoutes from "./routes/workloadConfig.routes.js";
import workAssignmentRoutes from "./routes/workAssignment.routes.js";
import productionLogRoutes from "./routes/productionLog.routes.js";
import statisticsRoutes from "./routes/statistics.routes.js";
import teamRoutes from "./routes/team.routes.js";
import teamMemberRoutes from "./routes/teamMember.routes.js";
import deviceTypeRoutes from "./routes/deviceType.routes.js";

const app = express();
const PORT = process.env["PORT"] || 3000;

// ==========================================
// MIDDLEWARE CHUNG
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// LOGGING MIDDLEWARE
// ==========================================
app.use(requestLogger);
app.use(errorLogger);

// ==========================================
// ROUTES CÔNG KHAI (KHÔNG CẦN TOKEN)
// ==========================================
app.use("/api/auth", authRoutes); // Đăng nhập

// ==========================================
// HEALTH CHECK (KHÔNG CẦN TOKEN)
// ==========================================
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ==========================================
// MIDDLEWARE XÁC THỰC (ÁP DỤNG CHO TẤT CẢ ROUTES BÊN DƯỚI)
// Mọi request đến đây đều phải có JWT token hợp lệ.
// Sau đó kiểm tra quyền: USER chỉ GET, ADMIN full quyền.
// ==========================================
app.use(authenticate);
app.use(authorizeRole);

// ==========================================
// ROUTES ĐƯỢC BẢO VỆ (CẦN TOKEN)
// ==========================================
app.use("/api/production-orders", productionOrderRoutes); // B1: Lệnh sản xuất
app.use("/api/stages", stageRoutes);                       // B1: Khâu sản xuất
app.use("/api/shifts", shiftRoutes);                       // Ca làm việc
app.use("/api/users", userRoutes);                         // Nhân viên
app.use("/api/workload-configs", workloadConfigRoutes);    // B2: Cấu hình định mức
app.use("/api/work-assignments", workAssignmentRoutes);    // B2: Phân công nhân sự
app.use("/api/production-logs", productionLogRoutes);      // B3: Nhập báo cáo
app.use("/api/statistics", statisticsRoutes);               // B4: Thống kê sản lượng
app.use("/api/teams", teamRoutes);                         // Team
app.use("/api/teams/:id/members", teamMemberRoutes);        // Team members
app.use("/api/device-types", deviceTypeRoutes);             // Danh mục loại thiết bị

// ==========================================
// KHỞI CHẠY SERVER
// ==========================================
app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    url: `http://localhost:${PORT}`,
  });
  logger.info(`API Endpoints available:`, {
    public: [
      "POST /api/auth/login",
      "GET  /api/health",
    ],
    authenticated: [
      "PUT  /api/auth/change-password",
      "CRUD /api/production-orders",
      "CRUD /api/stages",
      "CRUD /api/shifts",
      "CRUD /api/users",
      "CRUD /api/workload-configs",
      "CRUD /api/work-assignments",
      "POST /api/production-logs",
      "GET  /api/statistics",
      "CRUD /api/teams",
      "CRUD /api/teams/:id/members",
      "CRUD /api/device-types",
    ],
  });
});
