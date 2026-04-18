export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong on the server';

  // Morgan will log errors, but we can also log here if needed
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${req.method} ${req.url}: ${err.stack}`);
  }

  res.status(status).json({
    success: false,
    status,
    message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
