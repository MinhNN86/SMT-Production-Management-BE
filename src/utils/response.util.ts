/**
 * Response Utility Functions
 * Các hàm tiện ích xử lý response với format thống nhất
 */
import type { Response } from "express";
import { logger } from "./logger.util.js";

/**
 * Interface cho response format thống nhất
 */
interface UnifiedResponse<T = any> {
  status: string;
  code: number;
  message: string;
  timestamp: string;
  data: T;
}

/**
 * Tạo timestamp theo format ISO với múi giờ Việt Nam (UTC+7)
 */
function getTimestamp(): string {
  const now = new Date();
  // Tính offset múi giờ Việt Nam (UTC+7)
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return vietnamTime.toISOString().replace('Z', '+07:00');
}

/**
 * Gửi success response với format thống nhất
 * @param res - Express Response object
 * @param statusCode - HTTP status code
 * @param message - Success message
 * @param data - Response data
 */
export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): void {
  const response: UnifiedResponse<T | null> = {
    status: "success",
    code: statusCode,
    message,
    timestamp: getTimestamp(),
    data: data ?? null,
  };
  
  // Log success response
  logger.info(`Success Response: ${statusCode} - ${message}`, data);
  
  res.status(statusCode).json(response);
}

/**
 * Gửi error response với format thống nhất
 * @param res - Express Response object
 * @param statusCode - HTTP status code
 * @param message - Error message
 */
export function sendError(res: Response, statusCode: number, message: string): void {
  const response: UnifiedResponse<null> = {
    status: "error",
    code: statusCode,
    message,
    timestamp: getTimestamp(),
    data: null,
  };
  
  // Log error response
  logger.error(`Error Response: ${statusCode} - ${message}`, undefined, {
    statusCode,
    message,
  });
  
  res.status(statusCode).json(response);
}
