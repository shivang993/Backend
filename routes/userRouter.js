import mongoose from "mongoose";
// import register, { verifyOTP } from "../controllers/userController.js";
// import login from "../controllers/userController.js";

import register from "../controllers/userController.js";
import { verifyOTP } from "../controllers/userController.js";
import  {login}  from "../controllers/userController.js";
import { logout } from "../controllers/userController.js";  
import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { forgotPassword } from "../controllers/userController.js";
import { getUser } from "../controllers/userController.js";
import { resetPassword } from "../controllers/userController.js";
// import ErrorHandler from "../middleware/error.js";

const router = express.Router();


router.post("/register",register);
router.post("/otp-verification",verifyOTP);
router.post("/login",login);
router.get("/logout", isAuthenticated, logout);
router.get("/me",isAuthenticated,getUser)
router.post("/password/forgot",forgotPassword);
router.put("/password/reset/:token",resetPassword);




export default router;