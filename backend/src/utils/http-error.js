/**
 * 模块说明：HTTP 错误工具：创建带状态码的业务异常，供 service/controller 抛出。
 */
export function httpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}
