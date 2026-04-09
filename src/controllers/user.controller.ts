/**
 * User Controller
 * Tầng Controller: Xử lý request/response cho nhân viên.
 * Bổ sung: Hỗ trợ các trường email, password, role.
 */
import type { Response } from "express";
import * as userService from "../services/user.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

// ==========================================
// TẠO NHÂN VIÊN MỚI (chỉ SYSTEM_ADMIN)
// Có thể kèm email/password để worker có thể đăng nhập
// ==========================================
export async function create(req: AuthRequest, res: Response) {
  try {
    const { workerCode, fullName, type, email, password, role } = req.body as {
      workerCode: string;
      fullName: string;
      type?: "PARTTIME" | "FULLTIME";
      email?: string; 
      password?: string;
      role?: "SYSTEM_ADMIN" | "ADMIN" | "USER";
    };

    if (!workerCode || !fullName) {
      sendError(res, 400, "Thiếu thông tin: workerCode, fullName là bắt buộc.");
      return;
    }

    const user = await userService.createUser({
      workerCode,
      fullName,
      type,
      email,
      password,
      role,
    });
    sendSuccess(res, 201, "Tạo nhân viên thành công.", user);
  } catch (error: any) {
    if (error.code === "P2002") {
      sendError(res, 409, "Mã nhân viên hoặc email đã tồn tại.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY DANH SÁCH NHÂN VIÊN
// ==========================================
export async function getAll(_req: AuthRequest, res: Response) {
  try {
    const users = await userService.getAllUsers();
    sendSuccess(res, 200, "Lấy danh sách nhân viên thành công.", users);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY CHI TIẾT 1 NHÂN VIÊN
// ==========================================
export async function getById(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string;
    const user = await userService.getUserById(id);

    if (!user) {
      sendError(res, 404, "Không tìm thấy nhân viên.");
      return;
    }

    sendSuccess(res, 200, "Lấy chi tiết nhân viên thành công.", user);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// CẬP NHẬT THÔNG TIN NHÂN VIÊN
// SYSTEM_ADMIN: cập nhật tất cả các trường
// ADMIN/USER: chỉ được cập nhật fullName, email, password của chính mình
// ==========================================
export async function update(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string;
    const body = req.body as {
      workerCode?: string;
      fullName?: string;
      type?: "PARTTIME" | "FULLTIME";
      email?: string;
      password?: string;
      role?: "SYSTEM_ADMIN" | "ADMIN" | "USER";
    };

    if (req.user!.role !== "SYSTEM_ADMIN") {
      const restrictedFields: string[] = [];
      if ("workerCode" in body) restrictedFields.push("workerCode");
      if ("type" in body) restrictedFields.push("type");
      if ("role" in body) restrictedFields.push("role");

      if (restrictedFields.length > 0) {
        sendError(res, 400, `Bạn không có quyền thay đổi các trường: ${restrictedFields.join(", ")}. Chỉ có thể cập nhật fullName, email, password.`);
        return;
      }
    }

    const user = await userService.updateUser(id, body);
    sendSuccess(res, 200, "Cập nhật nhân viên thành công.", user);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy nhân viên.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// XÓA NHÂN VIÊN (chỉ SYSTEM_ADMIN)
// ==========================================
export async function remove(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string;
    await userService.deleteUser(id);
    sendSuccess(res, 200, "Xóa nhân viên thành công.", null);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy nhân viên.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}
