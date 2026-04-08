/**
 * Shift Controller
 * Tầng Controller: Xử lý request/response cho ca làm việc.
 */
import type { Request, Response } from "express";
import * as shiftService from "../services/shift.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";
import { transformShift, transformShifts } from "../utils/transform.util.js";

// ==========================================
// TẠO CA LÀM VIỆC MỚI
// ==========================================
export async function create(req: Request, res: Response) {
  try {
    const { shiftName, startTime, endTime } = req.body as {
      shiftName: string;
      startTime?: string;
      endTime?: string;
    };

    if (!shiftName) {
      sendError(res, 400, "Thiếu thông tin: shiftName là bắt buộc.");
      return;
    }

    const shift = await shiftService.createShift({ shiftName, startTime, endTime });
    sendSuccess(res, 201, "Tạo ca làm việc thành công.", transformShift(shift));
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY DANH SÁCH CA LÀM VIỆC
// ==========================================
export async function getAll(_req: Request, res: Response) {
  try {
    const shifts = await shiftService.getAllShifts();
    sendSuccess(res, 200, "Lấy danh sách ca làm việc thành công.", transformShifts(shifts));
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY CHI TIẾT 1 CA LÀM VIỆC
// ==========================================
export async function getById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const shift = await shiftService.getShiftById(id);

    if (!shift) {
      sendError(res, 404, "Không tìm thấy ca làm việc.");
      return;
    }

    sendSuccess(res, 200, "Lấy chi tiết ca làm việc thành công.", transformShift(shift));
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// CẬP NHẬT CA LÀM VIỆC
// ==========================================
export async function update(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const data = req.body as {
      shiftName?: string;
      startTime?: string;
      endTime?: string;
    };

    const shift = await shiftService.updateShift(id, data);
    sendSuccess(res, 200, "Cập nhật ca làm việc thành công.", transformShift(shift));
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy ca làm việc.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// XÓA CA LÀM VIỆC
// ==========================================
export async function remove(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await shiftService.deleteShift(id);
    sendSuccess(res, 200, "Xóa ca làm việc thành công.", null);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy ca làm việc.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}
