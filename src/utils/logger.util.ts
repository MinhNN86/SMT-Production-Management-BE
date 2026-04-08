/**
 * Logger Utility
 * Hệ thống logging với các mức độ khác nhau và lưu vào file riêng biệt
 */
import * as fs from "fs";
import * as path from "path";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private isDevelopment: boolean;
  private logDir: string;
  private requestLogFile: string;
  private responseLogFile: string;
  private errorLogFile: string;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== "production";
    this.logDir = path.join(process.cwd(), "logs");
    const dateString = this.getDateString();
    this.requestLogFile = path.join(this.logDir, `request-${dateString}.log`);
    this.responseLogFile = path.join(this.logDir, `response-${dateString}.log`);
    this.errorLogFile = path.join(this.logDir, `error-${dateString}.log`);
    
    // Tạo thư mục logs nếu chưa tồn tại
    this.ensureLogDirectory();
  }

  /**
   * Get current date string for filename
   */
  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format log entry
   */
  private format(entry: LogEntry): string {
    const { timestamp, level, message, data, error } = entry;
    
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      logMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`;
    }
    
    if (error) {
      logMessage += `\n  Error: ${error.message}`;
      if (error.stack && this.isDevelopment) {
        logMessage += `\n  Stack: ${error.stack}`;
      }
    }
    
    return logMessage;
  }

  /**
   * Get current timestamp với múi giờ Việt Nam (UTC+7)
   */
  private getTimestamp(): string {
    const now = new Date();
    // Tính offset múi giờ Việt Nam (UTC+7)
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return vietnamTime.toISOString().replace('Z', '+07:00');
  }

  /**
   * Write log to file
   */
  private writeToFile(logMessage: string, logFile: string): void {
    try {
      fs.appendFileSync(logFile, logMessage + "\n", "utf8");
    } catch (err) {
      console.error("Failed to write to log file:", err);
    }
  }

  /**
   * Log entry
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      data,
      error,
    };

    const formattedLog = this.format(entry);

    // Log to console with colors
    switch (level) {
      case "info":
        console.log(formattedLog);
        break;
      case "warn":
        console.warn(formattedLog);
        break;
      case "error":
        console.error(formattedLog);
        break;
      case "debug":
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
    }

    // Write to appropriate file
    this.writeToFile(formattedLog, this.errorLogFile);
  }

  /**
   * Info level log
   */
  info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  /**
   * Warn level log
   */
  warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  /**
   * Error level log
   */
  error(message: string, error?: Error, data?: any): void {
    this.log("error", message, data, error);
  }

  /**
   * Debug level log (chỉ trong development)
   */
  debug(message: string, data?: any): void {
    this.log("debug", message, data);
  }

  /**
   * Log HTTP request vào file riêng
   */
  logRequest(method: string, url: string, headers?: any, body?: any): void {
    const timestamp = this.getTimestamp();
    const logMessage = `[${timestamp}] [INFO] HTTP Request: ${method} ${url}\n  Data: ${JSON.stringify({
      headers: {
        "user-agent": headers?.["user-agent"],
        "content-type": headers?.["content-type"],
        authorization: headers?.["authorization"] ? "[HIDDEN]" : undefined,
      },
      ip: headers?.["ip"],
      body: body ? (this.isDevelopment ? body : "[Body hidden in production]") : undefined,
    }, null, 2)}`;
    
    // Log to console
    console.log(logMessage);
    
    // Write to request file
    this.writeToFile(logMessage, this.requestLogFile);
  }

  /**
   * Log HTTP response vào file riêng
   */
  logResponse(method: string, url: string, statusCode: number, body?: any, responseTime?: number): void {
    const timestamp = this.getTimestamp();
    const logMessage = `[${timestamp}] [INFO] HTTP Response: ${method} ${url}\n  Data: ${JSON.stringify({
      statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      body: body ? (this.isDevelopment ? body : "[Body hidden in production]") : undefined,
    }, null, 2)}`;
    
    // Log to console
    console.log(logMessage);
    
    // Write to response file
    this.writeToFile(logMessage, this.responseLogFile);
  }

  /**
   * Log database operation
   */
  logDatabase(operation: string, model: string, data?: any): void {
    this.debug(`Database: ${operation} on ${model}`, data);
  }

  /**
   * Log authentication event
   */
  logAuth(event: string, userId?: string, details?: any): void {
    this.info(`Auth: ${event}`, {
      userId,
      ...details,
    });
  }
}

// Export singleton instance
export const logger = new Logger();
