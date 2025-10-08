import {User} from "../model/userModel.js"; // ✅ make sure this import exists

// ✅ Function to send JWT token and cookie
const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();

  res
    .status(statusCode)
    .cookie("token", token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    })
    .json({
      success: true,
      message,
      user,
      token,
    });
};

export default sendToken;

// ✅ Get user details (fixed)
export const getUser = async (req, res, next) => {
  try {
    // Fetch the user based on the authenticated user's ID
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error); // Pass to your error middleware
  }
};
