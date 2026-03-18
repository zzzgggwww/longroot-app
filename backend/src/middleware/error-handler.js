/**
 * 模块说明：错误处理中间件：把业务异常和未命中路由统一转换成 HTTP 响应。
 */
export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Not Found' });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    details: err.details || null
  });
}
