/**
 * Auth Middleware
 * Xác thực JWT token từ header Authorization.
 * Gắn thông tin user vào req để các controller sử dụng.
 *
 * Tất cả API cần token trừ /api/auth/login.
 */
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const jwtSecret = process.env["JWT_SECRET"];

if (!jwtSecret) {
  throw new Error("Missing JWT_SECRET in environment variables.");
}
const JWT_SECRET: string = jwtSecret;

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
// Kiểm tra token → trích id → fetch user từ DB → gắn vào request
// ==========================================
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Chưa đăng nhập. Vui lòng cung cấp token." });
    return;
  }

  const token = authHeader.split(" ")[1]!;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        workerCode: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "Người dùng không tồn tại." });
      return;
    }

    req.user = user as AuthRequest["user"];
    next();
  } catch {
    res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
  }
}

// ==========================================
// MIDDLEWARE PHÂN QUYỀN THEO ROLE
// SYSTEM_ADMIN: toàn quyền
// ADMIN: toàn quyền (trừ quản lý user)
// USER: chỉ được GET (xem dữ liệu)
// ==========================================
export function authorizeRole(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Chưa xác thực." });
    return;
  }

  // SYSTEM_ADMIN được phép tất cả
  if (user.role === "SYSTEM_ADMIN") {
    next();
    return;
  }

  // ADMIN được phép tất cả các API trừ user management
  if (user.role === "ADMIN") {
    next();
    return;
  }

  // USER chỉ được phép GET (xem dữ liệu)
  if (user.role === "USER" && req.method === "GET") {
    next();
    return;
  }

  res.status(403).json({
    error: "Bạn không có quyền thực hiện thao tác này. Chỉ SYSTEM_ADMIN và ADMIN được toàn quyền, USER chỉ được xem dữ liệu.",
  });
}

// ==========================================
// MIDDLEWARE PHÂN QUYỀN QUẢN LÝ USER
// SYSTEM_ADMIN: toàn quyền (CRUD user khác)
// ADMIN: GET tất cả users, PUT chỉ chính mình
// USER: PUT chỉ chính mình
// ==========================================
export function authorizeUserManagement(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Chưa xác thực." });
    return;
  }

  // SYSTEM_ADMIN được phép tất cả
  if (user.role === "SYSTEM_ADMIN") {
    next();
    return;
  }

  // ADMIN được GET tất cả users
  if (user.role === "ADMIN" && req.method === "GET") {
    next();
    return;
  }

  // ADMIN và USER chỉ được cập nhật chính mình (PUT /api/users/:id)
  if ((user.role === "ADMIN" || user.role === "USER") && req.method === "PUT") {
    const targetUserId = req.params["id"];
    
    // Kiểm tra có phải chính mình không
    if (targetUserId === user.id) {
      next();
      return;
    }
  }

  res.status(403).json({
    error: "Bạn không có quyền thực hiện thao tác này. Chỉ SYSTEM_ADMIN được quản lý user, ADMIN được xem users và cập nhật chính mình, USER chỉ được cập nhật thông tin của chính mình.",
  });
}
