<<<<<<< HEAD
export const success = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const error = (res, message, err = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: err?.message || err || null
=======
export const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, message, error = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2
  });
};