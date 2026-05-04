/**
 * Unified response helpers — use these everywhere instead of raw res.json()
 */

export const ok = (res, data, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const created = (res, data, message = "Created successfully") =>
  res.status(201).json({ success: true, message, data });

export const fail = (res, message = "Bad request", statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

export const notFound = (res, message = "Not found") =>
  res.status(404).json({ success: false, message });

export const serverError = (res, message = "Internal server error") =>
  res.status(500).json({ success: false, message });

// Legacy aliases — kept so existing code using these doesn't break
export const successResponse = (res, message, data = null, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const errorResponse = (res, message, error = null, statusCode = 500) =>
  res.status(statusCode).json({ success: false, message, ...(error && { error }) });
