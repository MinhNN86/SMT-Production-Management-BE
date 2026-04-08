/**
 * WorkloadConfig Controller
 * Tầng Controller: Xử lý request/response cho cấu hình định mức.
 */
import type { Request, Response } from "express";
import * as workloadConfigService from "../services/workloadConfig.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";

// ==========================================
// TẠO CẤU HÌNH ĐỊNH MỨC MỚI
// ==========================================
export async function create(req: Request, res: Response) {
  try {
    const { stageId, numWorkers, targetQuantity, timeHours } = req.body as {
      stageId: number;
      numWorkers: number;
      targetQuantity: number;
      timeHours: number;
    };

    if (
      stageId === undefined
      || numWorkers === undefined
      || targetQuantity === undefined
      || timeHours === undefined
    ) {
      sendError(res, 400, "Thiếu thông tin: stageId, numWorkers, targetQuantity, timeHours là bắt buộc.");
      return;
    }

    const config = await workloadConfigService.createWorkloadConfig({
      stageId,
      numWorkers,
      targetQuantity,
      timeHours,
    });

    sendSuccess(res, 201, "Tạo cấu hình định mức thành công.", config);
  } catch (error: any) {
    if (error.code === "P2003") {
      sendError(res, 400, "Khâu sản xuất (stageId) không tồn tại hoặc liên kết không hợp lệ.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY DANH SÁCH CẤU HÌNH ĐỊNH MỨC
// ==========================================
export async function getAll(_req: Request, res: Response) {
  try {
    const configs = await workloadConfigService.getAllWorkloadConfigs();
    sendSuccess(res, 200, "Lấy danh sách cấu hình định mức thành công.", configs);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY CHI TIẾT 1 CẤU HÌNH ĐỊNH MỨC
// ==========================================
export async function getById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const config = await workloadConfigService.getWorkloadConfigById(id);

    if (!config) {
      sendError(res, 404, "Không tìm thấy cấu hình định mức.");
      return;
    }

    sendSuccess(res, 200, "Lấy chi tiết cấu hình định mức thành công.", config);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// CẬP NHẬT CẤU HÌNH ĐỊNH MỨC
// ==========================================
export async function update(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const data = req.body as {
      stageId?: number;
      numWorkers?: number;
      targetQuantity?: number;
      timeHours?: number;
    };

    const config = await workloadConfigService.updateWorkloadConfig(id, data);
    sendSuccess(res, 200, "Cập nhật cấu hình định mức thành công.", config);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy cấu hình định mức.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// XÓA CẤU HÌNH ĐỊNH MỨC
// ==========================================
export async function remove(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const deleted = await workloadConfigService.deleteWorkloadConfig(id);
    sendSuccess(res, 200, "Xóa cấu hình định mức thành công.", deleted);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy cấu hình định mức.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}
