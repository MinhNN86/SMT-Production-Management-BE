/**
 * Stage Controller
 * Tầng Controller: Xử lý request/response cho khâu sản xuất.
 */
import type { Request, Response } from "express";
import * as stageService from "../services/stage.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";

// ==========================================
// TẠO KHÂU SẢN XUẤT MỚI
// ==========================================
export async function create(req: Request, res: Response) {
  try {
    const { name, displayOrder, description, parentStageId, deviceTypeId } = req.body as {
      name: string;
      displayOrder: number;
      description?: string;
      parentStageId?: number | null;
      deviceTypeId?: number | null;
    };

    if (!name || displayOrder === undefined || deviceTypeId == null) {
      sendError(res, 400, "Thiếu thông tin: name, displayOrder, deviceTypeId là bắt buộc.");
      return;
    }

    const stage = await stageService.createStage({
      name,
      displayOrder,
      description,
      parentStageId,
      deviceTypeId,
    });
    sendSuccess(res, 201, "Tạo khâu sản xuất thành công.", stage);
  } catch (error: any) {
    if (error.code === "P2003") {
      sendError(res, 400, "Stage cha (parentStageId) hoặc loại thiết bị (deviceTypeId) không tồn tại.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY DANH SÁCH KHÂU SẢN XUẤT
// ==========================================
export async function getAll(_req: Request, res: Response) {
  try {
    const queryTree = (_req.query["tree"] as string | undefined)?.toLowerCase();
    const stages = queryTree === "true"
      ? await stageService.getStageTree()
      : await stageService.getAllStages();
    sendSuccess(res, 200, "Lấy danh sách khâu sản xuất thành công.", stages);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY CHI TIẾT 1 KHÂU SẢN XUẤT
// ==========================================
export async function getById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const stage = await stageService.getStageById(id);

    if (!stage) {
      sendError(res, 404, "Không tìm thấy khâu sản xuất.");
      return;
    }

    sendSuccess(res, 200, "Lấy chi tiết khâu sản xuất thành công.", stage);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY CÂY KHÂU SẢN XUẤT THEO LOẠI THIẾT BỊ
// ==========================================
export async function getByDeviceType(req: Request, res: Response) {
  try {
    const deviceTypeId = parseInt(req.params["deviceTypeId"] as string, 10);

    if (isNaN(deviceTypeId)) {
      sendError(res, 400, "ID loại thiết bị không hợp lệ.");
      return;
    }

    const stages = await stageService.getStageTreeByDeviceTypeId(deviceTypeId);
    sendSuccess(res, 200, "Lấy cây khâu sản xuất theo loại thiết bị thành công.", stages);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// CẬP NHẬT KHÂU SẢN XUẤT
// ==========================================
export async function update(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const data = req.body as {
      name?: string;
      displayOrder?: number;
      description?: string;
      parentStageId?: number | null;
      deviceTypeId?: number | null;
    };

    const stage = await stageService.updateStage(id, {
      name: data.name,
      displayOrder: data.displayOrder,
      description: data.description,
      parentStageId: data.parentStageId,
      deviceTypeId: data.deviceTypeId,
    });
    sendSuccess(res, 200, "Cập nhật khâu sản xuất thành công.", stage);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy khâu sản xuất.");
      return;
    }
    if (error.code === "P2003") {
      sendError(res, 400, "Stage cha (parentStageId) hoặc loại thiết bị (deviceTypeId) không tồn tại.");
      return;
    }
    if (error.code === "STAGE_PARENT_SELF" || error.code === "STAGE_HIERARCHY_CYCLE") {
      sendError(res, 400, error.message);
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// XÓA KHÂU SẢN XUẤT
// ==========================================
export async function remove(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await stageService.deleteStage(id);
    sendSuccess(res, 200, "Xóa khâu sản xuất thành công.", null);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy khâu sản xuất.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}
