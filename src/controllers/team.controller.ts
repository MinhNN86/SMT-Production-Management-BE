/**
 * Team Controller
 * Tầng Controller: Xử lý request/response cho team.
 */
import type { Request, Response } from "express";
import * as teamService from "../services/team.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";

export async function create(req: Request, res: Response) {
  try {
    const { teamName, description } = req.body as {
      teamName: string;
      description?: string;
    };

    if (!teamName) {
      sendError(res, 400, "Thiếu thông tin: teamName là bắt buộc.");
      return;
    }

    const team = await teamService.createTeam({ teamName, description });
    sendSuccess(res, 201, "Tạo team thành công.", team);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

export async function getAll(_req: Request, res: Response) {
  try {
    const teams = await teamService.getAllTeams();
    sendSuccess(res, 200, "Lấy danh sách team thành công.", teams);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const team = await teamService.getTeamById(id);

    if (!team) {
      sendError(res, 404, "Không tìm thấy team.");
      return;
    }

    sendSuccess(res, 200, "Lấy chi tiết team thành công.", team);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const data = req.body as {
      teamName?: string;
      description?: string;
    };

    const team = await teamService.updateTeam(id, data);
    sendSuccess(res, 200, "Cập nhật team thành công.", team);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy team.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await teamService.deleteTeam(id);
    sendSuccess(res, 200, "Xóa team thành công.", null);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy team.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}
