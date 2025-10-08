import catchAsyncError from "./catchAsyncError.js";
import jwt from "jsonwebtoken"
import ErrorHandler from "./error.js";
import {User} from "../model/userModel.js"

export const isAuthenticated = async (req, res, next) => {
//  console.log("from authcheck1");
    const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("User is not authenticated", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  req.user = await User.findById(decoded.id);

  if (!req.user) {
    return next(new ErrorHandler("User not found", 404));
  }

  next();
};
