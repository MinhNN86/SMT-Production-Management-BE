/**
 * Logging Middleware
 * Middleware để log tất cả HTTP requests và responses
 */
import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.util.js";

// Extend Express Request type để thêm startTime
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

/**
 * Request logging middleware
 * Log thông tin request khi đến và response khi đi
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Lưu thời gian bắt đầu
  req.startTime = Date.now();

  // Log request
  logger.logRequest(
    req.method,
    req.originalUrl,
    {
      headers: {
        "user-agent": req.get("user-agent"),
        "content-type": req.get("content-type"),
        authorization: req.get("authorization") ? "[HIDDEN]" : undefined,
      },
      ip: req.ip,
    },
    req.method !== "GET" && req.method !== "DELETE" ? req.body : undefined
  );

  // Override res.json để log response
  const originalJson = res.json;
  res.json = function (body: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : undefined;
    
    // Log response
    logger.logResponse(
      req.method,
      req.originalUrl,
      res.statusCode,
      body,
      responseTime
    );

    // Gọi hàm gốc
    return originalJson.call(this, body);
  };

  next();
}

/**
 * Error logging middleware
 * Log tất cả errors
 */
export function errorLogger(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const responseTime = req.startTime ? Date.now() - req.startTime : undefined;

  // Log error
  logger.error(
    `Error in ${req.method} ${req.originalUrl}`,
    err,
    {
      statusCode: (err as any).statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      ip: req.ip,
    }
  );

  // Chuyển error cho error handler tiếp theo
  next(err);
}
