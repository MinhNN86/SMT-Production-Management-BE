/**
 * User Service
 * Tầng Business Logic: Xử lý CRUD cho bảng nhân viên (users).
 * Bổ sung: Hash mật khẩu khi tạo/cập nhật user có email.
 */
import prisma from "../config/prisma.js";
import type { WorkerType, UserRole } from "../../generated/prisma/client.js";
import bcrypt from "bcryptjs";

// ==========================================
// TẠO NHÂN VIÊN MỚI
// Nếu có password → hash trước khi lưu
// ==========================================
export async function createUser(data: {
  workerCode: string;
  fullName: string;
  type?: WorkerType;
  email?: string;
  password?: string;
  role?: UserRole;
}) {
  // Mã hóa mật khẩu nếu có
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.create({ data });

  // Không trả về password trong response
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ==========================================
// LẤY DANH SÁCH NHÂN VIÊN
// Loại bỏ password khỏi response
// ==========================================
export async function getAllUsers() {
  const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
  return users.map(({ password: _, ...w }) => w);
}

// ==========================================
// LẤY CHI TIẾT 1 NHÂN VIÊN
// ==========================================
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ==========================================
// CẬP NHẬT THÔNG TIN NHÂN VIÊN
// Nếu có password mới → hash trước khi cập nhật
// ==========================================
export async function updateUser(
  id: string,
  data: {
    workerCode?: string;
    fullName?: string;
    type?: WorkerType;
    email?: string;
    password?: string;
    role?: UserRole;
  }
) {
  // Mã hóa mật khẩu mới nếu có
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({ where: { id }, data });
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ==========================================
// XÓA NHÂN VIÊN
// ==========================================
export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
