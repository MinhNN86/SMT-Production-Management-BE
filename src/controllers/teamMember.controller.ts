/**
 * TeamMember Controller
 * Tầng Controller: Xử lý request/response cho team_members.
 */
import type { Request, Response } from "express";
import * as teamMemberService from "../services/teamMember.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";

function getTeamIdFromParams(req: Request): number {
  const rawId = (req.params["id"] ?? req.params["teamId"]) as string | undefined;
  return parseInt(rawId ?? "", 10);
}

function isValidWorkerIds(workerIds: unknown): workerIds is string[] {
  return (
    Array.isArray(workerIds)
    && workerIds.length > 0
    && workerIds.every((id) => typeof id === "string" && id.length > 0)
  );
}

export async function add(req: Request, res: Response) {
  try {
    const teamId = getTeamIdFromParams(req);
    const { workerIds } = req.body as { workerIds: string[] };

    if (!teamId || !isValidWorkerIds(workerIds)) {
      sendError(res, 400, "Thiếu thông tin: teamId và workerIds[] là bắt buộc.");
      return;
    }

    const members = await teamMemberService.addMembersToTeam(teamId, workerIds);
    sendSuccess(res, 201, "Thêm thành viên vào team thành công.", members);
  } catch (error: any) {
    if (error.code === "P2003") {
      sendError(res, 400, "teamId hoặc workerIds không hợp lệ/không tồn tại.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

export async function update(req: Request, res: Response) {
  try {
    const teamId = getTeamIdFromParams(req);
    const { workerIds } = req.body as { workerIds: string[] };

    if (!teamId || !Array.isArray(workerIds) || !workerIds.every((id) => typeof id === "string" && id.length > 0)) {
      sendError(res, 400, "Thiếu thông tin: teamId và workerIds[] là bắt buộc.");
      return;
    }

    const members = await teamMemberService.replaceTeamMembers(teamId, workerIds);
    sendSuccess(res, 200, "Cập nhật danh sách thành viên team thành công.", members);
  } catch (error: any) {
    if (error.code === "P2003") {
      sendError(res, 400, "teamId hoặc workerIds không hợp lệ/không tồn tại.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

export async function list(req: Request, res: Response) {
  try {
    const teamId = getTeamIdFromParams(req);
    if (!teamId) {
      sendError(res, 400, "Thiếu thông tin: teamId là bắt buộc.");
      return;
    }

    const members = await teamMemberService.listMembersByTeam(teamId);
    sendSuccess(res, 200, "Lấy danh sách thành viên team thành công.", members);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const teamId = getTeamIdFromParams(req);
    const workerId = req.params["workerId"] as string;

    if (!teamId || !workerId) {
      sendError(res, 400, "Thiếu thông tin: teamId và workerId là bắt buộc.");
      return;
    }

    await teamMemberService.removeMemberFromTeam(teamId, workerId);
    sendSuccess(res, 200, "Xóa thành viên khỏi team thành công.", null);
  } catch (error: any) {
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy thành viên trong team.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}
