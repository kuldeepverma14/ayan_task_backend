export const ApiResponse = (statusCode, data, message = "Success") => {
  return {
    statusCode,
    data,
    message,
    success: statusCode < 400,
  };
};
