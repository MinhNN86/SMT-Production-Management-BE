/**
 * DeviceType Controller
 * Tầng Controller: Xử lý request/response cho loại thiết bị.
 */
import type { Request, Response } from "express";
import * as deviceTypeService from "../services/deviceType.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";

export async function create(req: Request, res: Response) {
  try {
    const { name, description } = req.body as {
      name: string;
      description?: string;
    };

    if (!name) {
      sendError(res, 400, "Thiếu thông tin: name là bắt buộc.");
      return;
    }

    const deviceType = await deviceTypeService.createDeviceType({ name, description });
    sendSuccess(res, 201, "Tạo loại thiết bị thành công.", deviceType);
  } catch (error: any) {
    if (error.code === "P2002") {
      sendError(res, 409, "Tên loại thiết bị đã tồn tại.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

export async function getAll(_req: Request, res: Response) {
  try {
    const deviceTypes = await deviceTypeService.getAllDeviceTypes();
    sendSuccess(res, 200, "Lấy danh sách loại thiết bị thành công.", deviceTypes);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const deviceType = await deviceTypeService.getDeviceTypeById(id);

    if (!deviceType) {
      sendError(res, 404, "Không tìm thấy loại thiết bị.");
      return;
    }

    sendSuccess(res, 200, "Lấy chi tiết loại thiết bị thành công.", deviceType);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const data = req.body as {
      name?: string;
      description?: string;
    };

    const deviceType = await deviceTypeService.updateDeviceType(id, data);
    sendSuccess(res, 200, "Cập nhật loại thiết bị thành công.", deviceType);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy loại thiết bị.");
      return;
    }
    if (error.code === "P2002") {
      sendError(res, 409, "Tên loại thiết bị đã tồn tại.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await deviceTypeService.deleteDeviceType(id);
    sendSuccess(res, 200, "Xóa loại thiết bị thành công.", null);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy loại thiết bị.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}
