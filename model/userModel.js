import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phone: {
    type: String,
  },

  password: {
    type: String,
    required: true,
    select: false, // for security — password not returned by default
  },

  accountVerified: {
    type: Boolean,
    default: false,
  },

  verificationCode: {
    type: String,
  },

  verificationCodeExpire: {
    type: Date,
  },

  resetPasswordToken: {
    type: String,
  },

  resetPasswordExpire: {
    type: Date,
  },

  resetPasswordCodeVerified: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  const res =  await bcrypt.compare(enteredPassword, this.password);
  // console.log('from compare', this.password, enteredPassword, res);
  return res;
};

// ✅ Generate 5-digit verification code
userSchema.methods.generateVerificationCode = function () {
  const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();
//   this.verificationCode = crypto.createHash("sha256").update(verificationCode).digest("hex");
this.verificationCode = verificationCode;
  this.verificationCodeExpire = Date.now() + 5 * 60 * 1000; // expires in 5 mins
  return verificationCode;
};

// ✅ Generate JWT token
userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};








export const User = mongoose.model("User", userSchema);
