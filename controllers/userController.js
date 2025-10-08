import ErrorHandler from "../middleware/error.js";
import { User } from "../model/userModel.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";
import twilio from "twilio";
import sendToken from "../utils/sendToken.js";
import catchAsyncError from "../middleware/catchAsyncError.js";
import crypto from "crypto";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ================= REGISTER USER =================
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, verificationMethod } = req.body;

    // ✅ Check required fields
    if (!name || !email || !password || !phone || !verificationMethod) {
      return next(new ErrorHandler("Please enter all fields", 400));
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase();

    // ✅ Validate phone
    if (!/^\+91\d{10}$/.test(phone)) {
      return next(new ErrorHandler("Invalid Phone Number", 400));
    }

    // ✅ Check verified user exists
    const existingVerifiedUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone }],
      accountVerified: true,
    });
    if (existingVerifiedUser) {
      return next(new ErrorHandler("Phone or Email already exists", 409));
    }

    // ✅ Check unverified user exists
    const existingUnverifiedUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone }],
      accountVerified: false,
    });
    if (existingUnverifiedUser) {
      return res.status(200).json({
        success: true,
        message: "User already registered. Please check your email for the OTP.",
      });
    }

    // ✅ Hash password
   // const hashedPassword = await bcrypt.hash(password, 10);

  
    // ✅ Create new user
    const newUser = new User({
      name,
      email: normalizedEmail,
      phone,
      password: password,
    });

    // ✅ Generate numeric OTP
    const verificationCode = newUser.generateVerificationCode();

    // ✅ Save user
    await newUser.save();

    // ✅ Send OTP
    await sendVerificationCode(verificationMethod, verificationCode, normalizedEmail, phone);

    return res.status(200).json({
      success: true,
      message: "User registered successfully. Verification code sent.",
    });
  } catch (error) {
    next(error);
  }
};

// ================= SEND VERIFICATION CODE =================
async function sendVerificationCode(verificationMethod, verificationCode, email, phone) {
  if (verificationMethod === "email") {
    const message = generateEmailTemplate(verificationCode);
    await sendEmail({ email, subject: "Your Verification Code", message });
  } else if (verificationMethod === "sms") {
    await client.messages.create({
      body: `Your verification code is: ${verificationCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } else {
    throw new ErrorHandler("Invalid verification method", 400);
  }
}

// ================= EMAIL TEMPLATE =================
function generateEmailTemplate(verificationCode) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 16px; color: #333;">Dear User,</p>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          ${verificationCode}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">Please use this code to verify your account. It will expire in 10 minutes.</p>
      <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
    </div>
  `;
}
export default register;

// ================= VERIFY OTP =================
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, phone, otp } = req.body;

    if (!email && !phone) return next(new ErrorHandler("Email or Phone is required", 400));
    if (!otp) return next(new ErrorHandler("OTP is required", 400));

    const normalizedEmail = email ? email.toLowerCase() : null;

    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone }],
      accountVerified: false,
    }).select("+verificationCode +verificationCodeExpire");

    if (!user) return next(new ErrorHandler("User not found or already verified", 404));

    if (String(user.verificationCode) !== String(otp)) {
      return next(new ErrorHandler("Invalid OTP", 400));
    }

    if (!user.verificationCodeExpire || Date.now() > user.verificationCodeExpire.getTime()) {
      return next(new ErrorHandler("OTP expired", 400));
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save();

    sendToken(user, 200, "Account verified successfully", res);
  } catch (error) {
    next(error);
  }
};

// ================= LOGIN USER =================
export const login = async (req, res, next) => {
  const { email, password } = req.body;
    console.log(req.body);
    
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  } 

  const user = await User.findOne({ email, accountVerified: true }).select("+password");
  if (!user) return next(new ErrorHandler("ritish", 401));
console.log(password);
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) return next(new ErrorHandler("shivang", 400));

  sendToken(user, 200, "User logged in successfully", res);
};



// ================= LOGOUT USER =================



const logout = (async (req, res, next) => {
  res.status(200).cookie("token", "", {
    expires: new Date(Date.now()),
    httpOnly: true,
  }).json({
    success: true,
    message: "User logged out successfully",
  });
});
export {logout}


export const getUser = (async (req, res, next) => {
  const user = req.user;
  // console.log(user);
  res.status(200).json({
      success: true,
      user,
  });
  

});
//================== FORGOT PASSWORD =================  
export const forgotPassword = async (req, res, next) => {
  console.log('from forgotpassword');
  const user = await User.findOne({
    email: req.body.email,
    accountVerified: true,
  });
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }
  const resetToken = user.generateResetPasswordToken();
  // console.log('from forgot', resetToken);
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `Your Reset Password Token is:- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it.`;

  try {
    sendEmail({
      email: user.email,
      subject: "MERN AUTHENTICATION APP RESET PASSWORD",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new ErrorHandler(
        error.message ? error.message : "Cannot send reset password token.",
        500
      )
    );
  }
};

//================== RESET PASSWORD =================


export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "Reset password token is invalid or has been expired.",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password & confirm password do not match.", 400)
    );
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, "Reset Password Successfully.", res);
};



