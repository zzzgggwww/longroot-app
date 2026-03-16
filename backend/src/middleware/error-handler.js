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
