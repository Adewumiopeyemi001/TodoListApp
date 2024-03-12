const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require('../Models/user.schema');


const login = async (req, res) => {
    try {
      const {userName, password} = req.body;
      if(!userName || !password) {
        res.status(400).json({message: "Please input your username and password"});
      }
  // Find The User By Email In the Database
      const user = await User.findOne({ userName });
    
      // If you are not a user, sign up
      if(!user) {
        res.status(404).json({message: "User Not Found, Please SignUp"});
      }
  
      if (!user.isVerified) {
        return res.status(404).json({ message: "User Not Verified, Please check your email"});
      }
  
      const correctPassword = await bcrypt.compare(password, user.password);
      if (!correctPassword) {
        return res.status(400).json({message: "Incorrect Password"});
      }
  
      // Generate a token
      const token = jwt.sign({ userId: user._id}, process.env.SECRET_KEY, {
        expiresIn: "2h"  // Token expiration time
      });
      return res.status(200).json({message: "User Logged in Successfully", token: token, user});
  
    }catch (error) {
      console.log(error);
      return res.status(500).json({message: "Error Logging In User", error})
    }
  };

  module.exports = login;