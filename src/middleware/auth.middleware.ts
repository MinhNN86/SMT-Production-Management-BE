/**
 * Auth Middleware
 * Xác thực JWT token từ header Authorization.
 * Gắn thông tin user vào req để các controller sử dụng.
 *
 * Tất cả API cần token trừ /api/auth/login.
 */
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const jwtSecret = process.env["JWT_SECRET"];

if (!jwtSecret) {
  throw new Error("Missing JWT_SECRET in environment variables.");
}
const JWT_SECRET: string = jwtSecret;

// Mở rộng Request type để chứa thông tin user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "SYSTEM_ADMIN" | "ADMIN" | "USER";
    fullName: string;
    workerCode: string;
  };
}

// ==========================================
// MIDDLEWARE XÁC THỰC JWT
// Kiểm tra token → gắn user info vào request
// ==========================================
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Chưa đăng nhập. Vui lòng cung cấp token." });
    return;
  }

  const token = authHeader.split(" ")[1]!;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
  }
}

// ==========================================
// MIDDLEWARE PHÂN QUYỀN THEO ROLE
// USER: chỉ được GET (xem dữ liệu)
// ADMIN: được full quyền (GET, POST, PUT, DELETE)
// ==========================================
export function authorizeRole(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Chưa xác thực." });
    return;
  }

  // SYSTEM_ADMIN và ADMIN được phép tất cả
  if (user.role === "SYSTEM_ADMIN" || user.role === "ADMIN") {
    next();
    return;
  }

  // USER chỉ được phép GET (xem dữ liệu)
  if (req.method === "GET") {
    next();
    return;
  }

  // USER không được POST, PUT, DELETE
  res.status(403).json({
    error: "Bạn không có quyền thực hiện thao tác này. Chỉ ADMIN mới được thêm/sửa/xóa.",
  });
}
