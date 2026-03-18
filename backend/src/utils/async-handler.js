/**
 * 模块说明：异步包装工具：把 async controller 的异常自动转交给错误处理中间件。
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
