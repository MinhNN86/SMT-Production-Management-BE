/**
 * Auth Service
 * Tầng Business Logic: Xử lý đăng nhập và tạo JWT token.
 */
import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const jwtSecret = process.env["JWT_SECRET"];
// Thời hạn token: mặc định 86400 giây = 24 giờ
const JWT_EXPIRES_IN = parseInt(process.env["JWT_EXPIRES_IN"] || "86400", 10);

if (!jwtSecret) {
  throw new Error("Missing JWT_SECRET in environment variables.");
}
const JWT_SECRET: string = jwtSecret;

// ==========================================
// ĐĂNG NHẬP
// Kiểm tra email/password → trả JWT token
// ==========================================
export async function login(email: string, password: string) {
  // Tìm user theo email
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }

  // So sánh mật khẩu
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }

  // Tạo JWT token chứa thông tin user
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    workerCode: user.workerCode,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  // Trả về token + thông tin user (không kèm password)
  const { password: _, ...userInfo } = user;
  return { token, user: userInfo };
}

// ==========================================
// ĐỔI MẬT KHẨU
// Admin có thể đổi mật khẩu của bất kỳ user nào (không cần oldPassword)
// User chỉ có thể đổi mật khẩu của chính mình (cần oldPassword)
// ==========================================
export async function changePassword(
  userId: string,
  oldPassword: string | undefined,
  newPassword: string
) {
  // Tìm user theo id
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.password) {
    throw new Error("Không tìm thấy người dùng.");
  }

  // Chỉ so sánh mật khẩu cũ nếu được cung cấp (user đổi mật khẩu của chính mình)
  if (oldPassword) {
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error("Mật khẩu cũ không đúng.");
    }
  }

  // Hash mật khẩu mới
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Cập nhật mật khẩu trong database
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Trả về thông tin user (không kèm password)
  const { password: _, ...userInfo } = user;
  return userInfo;
}

// ==========================================
// LẤY THÔNG TIN USER HIỆN TẠI
// Trả về thông tin của user đang đăng nhập
// ==========================================
export async function getMe(userId: string) {
  // Tìm user theo id
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("Không tìm thấy người dùng.");
  }

  // Trả về thông tin user (không kèm password)
  const { password: _, ...userInfo } = user;
  return userInfo;
}
