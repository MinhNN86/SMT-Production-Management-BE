/**
 * Auth Controller
 * Tầng Controller: Xử lý request/response cho đăng nhập.
 */
import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

// ==========================================
// ĐĂNG NHẬP
// POST /api/auth/login
// Body: { email, password }
// Response: { token, user }
// ==========================================
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    // Validate input
    if (!email || !password) {
      sendError(res, 400, "Thiếu thông tin: email và password là bắt buộc.");
      return;
    }

    // Gọi service xử lý đăng nhập
    const result = await authService.login(email, password);

    sendSuccess(res, 200, "Đăng nhập thành công.", result);
  } catch (error: any) {
    // Lỗi sai email/password
    if (error.message === "Email hoặc mật khẩu không đúng.") {
      sendError(res, 401, error.message);
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// ĐỔI MẬT KHẨU
// PUT /api/auth/change-password
// Body: { userId?, oldPassword?, newPassword }
// - Admin có thể đổi mật khẩu của bất kỳ user nào (cung cấp userId, không cần oldPassword)
// - User chỉ có thể đổi mật khẩu của chính mình (không cần cung cấp userId, cần oldPassword)
// ==========================================
export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { userId, oldPassword, newPassword } = req.body as {
      userId?: string;
      oldPassword?: string;
      newPassword: string;
    };

    // Validate input
    if (!newPassword) {
      sendError(res, 400, "Thiếu thông tin: newPassword là bắt buộc.");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      sendError(res, 400, "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    // Xác định userId cần đổi mật khẩu
    let targetUserId: string;
    let isAdminChangingOtherUser = false;

    if (userId !== undefined) {
      // Admin muốn đổi mật khẩu của user khác
      if (req.user?.role !== "ADMIN") {
        sendError(res, 403, "Bạn không có quyền đổi mật khẩu của người khác. Chỉ ADMIN mới được phép.");
        return;
      }
      targetUserId = userId;
      isAdminChangingOtherUser = true;
    } else {
      // User đổi mật khẩu của chính mình
      targetUserId = req.user!.id;
    }

    // User đổi mật khẩu của chính mình thì cần oldPassword
    if (!isAdminChangingOtherUser && !oldPassword) {
      sendError(res, 400, "Thiếu thông tin: oldPassword là bắt buộc khi đổi mật khẩu của chính mình.");
      return;
    }

    // Gọi service xử lý đổi mật khẩu
    const result = await authService.changePassword(targetUserId, oldPassword, newPassword);

    sendSuccess(res, 200, "Đổi mật khẩu thành công.", result);
  } catch (error: any) {
    // Lỗi mật khẩu cũ không đúng
    if (error.message === "Mật khẩu cũ không đúng.") {
      sendError(res, 400, error.message);
      return;
    }
    // Lỗi không tìm thấy user
    if (error.message === "Không tìm thấy người dùng.") {
      sendError(res, 404, error.message);
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY THÔNG TIN USER HIỆN TẠI
// GET /api/auth/me
// Trả về thông tin của user đang đăng nhập
// ==========================================
export async function getMe(req: AuthRequest, res: Response) {
  try {
    // Lấy userId từ token
    const userId = req.user!.id;

    // Gọi service xử lý lấy thông tin user
    const result = await authService.getMe(userId);

    sendSuccess(res, 200, "Lấy thông tin thành công.", result);
  } catch (error: any) {
    // Lỗi không tìm thấy user
    if (error.message === "Không tìm thấy người dùng.") {
      sendError(res, 404, error.message);
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}
