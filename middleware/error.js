class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    err.message = `Resource not found. Invalid: ${err.path}`;
    err.statusCode = 400;
  }

  // Invalid JWT
  if (err.name === "JsonWebTokenError") {
    err.message = "JSON Web Token is invalid, try again";
    err.statusCode = 400;
  }

  // Expired JWT
  if (err.name === "TokenExpiredError") {
    err.message = "JSON Web Token has expired, please log in again";
    err.statusCode = 400;
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue);
    err.message = `Duplicate ${field} entered`;
    err.statusCode = 400;
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
;
export default ErrorHandler;
// export default errorMiddleware
export { errorMiddleware };