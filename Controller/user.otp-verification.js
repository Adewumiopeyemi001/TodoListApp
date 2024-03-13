const User = require('../Models/user.schema');


const isVerifyOtp = async (req, res) => {
    try {
      const otp = req.query.otp;
    if (!otp) {
      return res.status(400).json({message: "Please input Your Otp"})
    }
    const user = await User.findOne({otp: otp});
    if (!user) {
      return res.status(400).json({message: "User With That Otp Not Found"});
    }
  
  // Check if the OTP has expired
  const currentTime = new Date();
  if (user.otpExpiration && currentTime > user.otpExpiration) {
    return res.status(400).json({ message: "OTP has expired, please request a new one" });
  }
  
    if (user.otp !== otp) {
      return res.status(400).json({message: "Invalid OTP"});
    }
    user.isVerified = true;
    user.otpExpiration = null;
    user.otp = null;
  
    await user.save();
  
    return res.status(200).json({message: "OTP Verified successfully"});
    }catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Error Verfying OTP"});
    }
  };

  module.exports = isVerifyOtp;