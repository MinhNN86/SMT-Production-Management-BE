/**
 * ProductionOrder Controller
 * Tầng Controller: Xử lý request/response cho lệnh sản xuất.
 */
import type { Request, Response } from "express";
import * as productionOrderService from "../services/productionOrder.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";
import { transformEmbeddedShifts } from "../utils/transform.util.js";

// ==========================================
// TẠO LỆNH SẢN XUẤT MỚI
// ==========================================
export async function create(req: Request, res: Response) {
  try {
    const { orderCode, totalQuantity, orderSignedDate, productionStartDate, completedDate, deadlineDate, deviceTypeId } = req.body as {
      orderCode?: string;
      totalQuantity?: number;
      orderSignedDate?: string;
      productionStartDate?: string;
      completedDate?: string;
      deadlineDate?: string;
      deviceTypeId?: number | null;
    };

    if (!orderCode?.trim() || totalQuantity == null || !deadlineDate || deviceTypeId == null) {
      sendError(res, 400, "Thiếu thông tin: orderCode, totalQuantity, deadlineDate, deviceTypeId là bắt buộc.");
      return;
    }

    const parsedDeadlineDate = new Date(deadlineDate);
    if (Number.isNaN(parsedDeadlineDate.getTime())) {
      sendError(res, 400, "deadlineDate không hợp lệ.");
      return;
    }

    if (!Number.isInteger(totalQuantity) || totalQuantity <= 0) {
      sendError(res, 400, "totalQuantity phải là số nguyên dương.");
      return;
    }

    if (!Number.isInteger(deviceTypeId) || deviceTypeId <= 0) {
      sendError(res, 400, "deviceTypeId phải là số nguyên dương.");
      return;
    }

    const order = await productionOrderService.createProductionOrder({
      orderCode: orderCode.trim(),
      totalQuantity,
      orderSignedDate: orderSignedDate ? new Date(orderSignedDate) : undefined,
      productionStartDate: productionStartDate ? new Date(productionStartDate) : undefined,
      completedDate: completedDate ? new Date(completedDate) : undefined,
      deadlineDate: parsedDeadlineDate,
      deviceTypeId,
    });

    sendSuccess(res, 201, "Tạo lệnh sản xuất thành công.", order);
  } catch (error: any) {
    if (error.code === "P2002") {
      sendError(res, 409, "Mã lệnh sản xuất đã tồn tại.");
      return;
    }
    if (error.code === "P2003") {
      sendError(res, 400, "Loại thiết bị (deviceTypeId) không tồn tại.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY DANH SÁCH TẤT CẢ LỆNH SẢN XUẤT
// ==========================================
export async function getAll(_req: Request, res: Response) {
  try {
    const orders = await productionOrderService.getAllProductionOrders();
    sendSuccess(res, 200, "Lấy danh sách lệnh sản xuất thành công.", orders);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY CHI TIẾT 1 LỆNH SẢN XUẤT
// ==========================================
export async function getById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const order = await productionOrderService.getProductionOrderById(id);

    if (!order) {
      sendError(res, 404, "Không tìm thấy lệnh sản xuất.");
      return;
    }

    sendSuccess(res, 200, "Lấy chi tiết lệnh sản xuất thành công.", order);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// CẬP NHẬT LỆNH SẢN XUẤT
// ==========================================
export async function update(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const { deadlineDate, orderSignedDate, productionStartDate, completedDate, ...rest } = req.body as {
      orderCode?: string;
      totalQuantity?: number;
      orderSignedDate?: string;
      productionStartDate?: string;
      completedDate?: string;
      deadlineDate?: string;
      deviceTypeId?: number | null;
      status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    };

    const data = {
      ...rest,
      orderSignedDate: orderSignedDate ? new Date(orderSignedDate) : undefined,
      productionStartDate: productionStartDate ? new Date(productionStartDate) : undefined,
      completedDate: completedDate ? new Date(completedDate) : undefined,
      deadlineDate: deadlineDate ? new Date(deadlineDate) : undefined,
    };

    const order = await productionOrderService.updateProductionOrder(id, data);
    sendSuccess(res, 200, "Cập nhật lệnh sản xuất thành công.", order);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy lệnh sản xuất.");
      return;
    }
    if (error.code === "P2003") {
      sendError(res, 400, "Loại thiết bị (deviceTypeId) không tồn tại.");
      return;
    }
    if (error.code === "P2002") {
      sendError(res, 409, "Mã lệnh sản xuất đã tồn tại.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// XÓA LỆNH SẢN XUẤT
// ==========================================
export async function remove(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await productionOrderService.deleteProductionOrder(id);
    sendSuccess(res, 200, "Xóa lệnh sản xuất thành công.", null);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy lệnh sản xuất.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY DANH SÁCH NHẬT KÝ SẢN XUẤT CỦA LỆNH SẢN XUẤT
// ==========================================
export async function getProductionLogs(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);

    if (isNaN(id)) {
      sendError(res, 400, "ID không hợp lệ.");
      return;
    }

    const logs = await productionOrderService.getProductionLogsByOrderId(id);
    sendSuccess(res, 200, "Lấy danh sách nhật ký sản xuất thành công.", transformEmbeddedShifts(logs));
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LỌC NHẬT KÝ SẢN XUẤT CỦA LỆNH SẢN XUẤT THEO NGÀY VÀ CA
// ==========================================
export async function filterProductionLogs(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);

    if (isNaN(id)) {
      sendError(res, 400, "ID không hợp lệ.");
      return;
    }

    const { date, startDate, endDate, shiftIds } = req.body as {
      date?: string;
      startDate?: string;
      endDate?: string;
      shiftIds?: number[];
    };

    const hasDate = !!(date || startDate || endDate);
    const hasShift = shiftIds && shiftIds.length > 0;

    if (!hasDate || !hasShift) {
      sendError(res, 400, "Cần cả điều kiện ngày (date, startDate, hoặc endDate) và ca (shiftIds).");
      return;
    }

    const filters: any = { productionOrderId: id };

    if (date) {
      filters.logDate = new Date(date);
    } else if (startDate || endDate) {
      if (startDate && endDate) {
        filters.logDate = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      } else if (startDate) {
        filters.logDate = {
          gte: new Date(startDate),
        };
      } else if (endDate) {
        filters.logDate = {
          lte: new Date(endDate),
        };
      }
    }

    if (shiftIds && shiftIds.length > 0) {
      filters.shiftId = {
        in: shiftIds,
      };
    }

    const logs = await productionOrderService.getProductionLogsWithFilters(filters);
    sendSuccess(res, 200, "Lọc nhật ký sản xuất thành công.", transformEmbeddedShifts(logs));
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}
