const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const cloudinary = require("../public/image/cloudinary");
const ejs = require("ejs");
const path = require("path");
const User = require('../Models/user.schema');
const { emailSenderTemplate } = require("../middleware/email");

const OTP_EXPIRATION_TIME_MINUTES = 1;

exports.signup = async (req, res) => {
  try {
    const { userName, password, email } = req.body;

    if (!userName || !password || !email) { 
      return res
        .status(400)
        .json({ message: "Please provide username, password, and email" });
    }

    // Password validation: Must contain at least one uppercase, one lowercase, one number, and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ message: "User already exists" });
    };

    // Generate OTP
    const generateOTP = () => {
      const digits = '0123456789';
      let OTP = '';
      for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }
      return OTP;
    };

    const otp = generateOTP();

    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + OTP_EXPIRATION_TIME_MINUTES); // Set expiration time

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      userName,
      password: hashedPassword,
      email,
      otp,
      otpExpiration,
      token,
    });
    await newUser.save();

 // Send email with OTP

 await ejs.renderFile(
  path.join(__dirname, "../public/signup.ejs"),
  {
    title: `Hello ${userName},`,
    body: "Welcome",
    userName: userName,
    otp: otp,
  },
  async (err, data) => {
    await emailSenderTemplate(data, "Welcome to Todo List App!", email);
  }
);

    return res
      .status(201)
      .json({ message: "User saved successfully", newUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error saving user", err });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
      const {email} = req.body;
      if (!email) {
        return res.status(400).json({message: "Please Input Your Email"});
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({message: "User Not Found"});
      }
      // Generate a token for password reset
    const token = uuidv4(); // Generate UUID token

    // Save the token in the user document (if necessary)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expiration time (1 hour)

    await user.save();

    await ejs.renderFile(
      path.join(__dirname, "../public/email/forgetpassword.ejs"),
      {
        title: `Reset Your Password,`,
        body: "Welcome",
        resetPasswordToken: token,
      },
      async (err, data) => {
        await emailSenderTemplate(data, "Reset Your Password", email);
      }
    );

    return res.status(200).json({ message: "Check Your Mail To Reset Your Password", user});

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error resetting password", err });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const { newPassword, confirmPassword} = req.body;
    if (!token) {
      return res.status(400).json({message: "Please Input Your Reset Token"});
    }
    const user = await User.findOne({ resetPasswordToken: token });
    if (!user) {
      return res.status(400).json({message: "User Not Found"});
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({message: "Password Does Not Match"});
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordExpires = null,
    user.resetPasswordExpires = null,
    user.save();

    await ejs.renderFile(
      path.join(__dirname, "../public/email/resetpasword.ejs"),
      {
        title: `Hello ${user.userName},`,
        body: "Password Reset Successfully, Please Login",
      },
      async (err, data) => {
        await emailSenderTemplate(data, "Password Reset Successfully", user.email);
      }
    );
    return res.status(200).json({message: "Password Reset Successfully", user})

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error Updating password", err });
  }
}


exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }
    
    // Check if previous OTP has expired
    const now = new Date();
    if (user.otpExpiration && user.otpExpiration > now) {
      return res.status(400).json({ message: "Previous OTP has not expired yet" });
    }

    const generateOTP = () => {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
    };

    // Generate new OTP and update expiration time
    const otp = generateOTP();
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + OTP_EXPIRATION_TIME_MINUTES);

    user.otp = otp;
    user.otpExpiration = otpExpiration;
    user.isVerified = false;
    await user.save();
  
    await ejs.renderFile(
      path.join(__dirname, "../public/resendotp.ejs"),
      {
        title: `Hello ${user.userName},`,
        body: "Welcome",
        userName: user.userName,
        otp: otp,
      },
      async (err, data) => {
        await emailSenderTemplate(data, "Resent OTP for Todo List App", email);
      }
    );

    return res.status(200).json({ message: "New OTP sent successfully", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error sending OTP" });
  }
};

exports.addList = async (req, res) => {
  try {
    const id = req.params.id;
    const { description } = req.body;
    if (!description) {
      return res
        .status(400)
        .json({ message: "Please input Description For Your List" });
    }
    const user = await User.findById({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    user.list.push({ description });
    await user.save();
    return res
      .status(200)
      .json({ message: "Todo List Saved Successfully", user });
  }catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error Saving List", err });
  }
};

exports.updateListDescription = async (req, res) => {
  try {
    const userId = req.params.id;
    const listId = req.params.listId;
    const { newDescription } = req.body;
    if (!newDescription) {
     return res.status(400).json({message: "Please provide a new description for you list item"});
    }
    const user = await User.findById({_id: userId});
    if (!user) {
    return  res.status(404).json({message: "User Not Found"});
    }
    const listItem = user.list.id(listId);
    if (!listItem) {
    return  res.status(404).json({message: "List Item Not Found"});
    }
    listItem.description = newDescription;
    await user.save();
   return res.status(200).json({message: "List Item Description Updated Successfully", user});
  }catch (err) {
   return res.status(500).json({message: "Error Updating List Item Description", err});
  }
};

exports.updateEmail = async (req, res) => {
  try {
    const id = req.params.id;
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(404).json({message: "Please provide your New Email"});
    }
    const user = await User.findByIdAndUpdate({_id: id}, {email: newEmail}, {new: true});
    if (!user) {
      return res.status(404).json({message: "User Not Found"});
    }
    user.email = newEmail;
    await user.save();
    return res.status(200).json({message: "Email Updated Successfully", user});
  }catch (err) {
    return res.status(500).json({message: "Error Updating Email", err});
  }
};
exports.completedTodo = async (req, res) => {
  try {
    const userId = req.params.id;
    const listId = req.params.listId;
    const user = await User.findById({_id: userId});
    if (!user) {
      return res.status(404).json({message: "User Not Found"});
    }
    const completedList = user.list.id(listId);
    if (!completedList) {
      return res.status(404).json({message: "List Item Not Found"});
    }
    completedList.completed = true;
    await user.save();
    return res.status(200).json({message: "You Have Completed Your Task Successfully", user});
  }catch (err) {
    return res.status(500).json({message: "Error Updating List Items Description", err});
  }
};
exports.getAllList = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({message: "User Not Found"});
    }
    const allList = user.list;
    return res.status(200).json({message: "All ToDo List Fetched Successfully", data: allList.length, allList});
  }catch (err) {
    return res.status(500).json({message: "Error fetching all Todo", err});
  }
};
exports.getAllListAndPaginate = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({message: "User Not Found"});
    }
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;

    const allList = user.list.slice(startIndex, endIndex);

    return res.status(200).json({message: "All Todo List Fetched Successfully",
  data: {
    data: {
      totalItems: user.list.length,
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(user.list.length / pageSize),
      currentItems: allList.length,
      items: allList,
  },
  }
});
  }catch (err) {
    return res.status(500).json({message: "Error Fetching ToDo List", err});
  }
};
exports.completedToDoList = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({message: "User Not Found"});
    }
    const completedList = user.list.filter((item) => item.completed === true);
    return res.status(200).json({message: "Completed ToDo list Fectched Successfully", data: completedList.length, completedList});
  }catch (err) {
    return res.status(500).json({message: "Error Fetching completed Todo list", err});
  }
};
exports.filteredByDescription = async (req, res) => {
  try {
    const id = req.params.id;
    const pattern = req.query.pattern;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({message: "User Not Found"});
    }
    const descriptionRegex = new RegExp(pattern, "i");
    const filteredList = user.list.filter((item) => descriptionRegex.test(item.description));
    return res.status(200).json({message: "Filtered Todo List by Description Successfully", data: filteredList.length, filteredList,});
  }catch (err) {
    return res.status(500).json({message: "Error fetching filtered Todo List", err});
  }
};
exports.filteredByDate = async (req, res) => {
  try {
    const id = req.params.id;
    const datePattern = req.query.datePattern;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({message: "User Not Found"});
    }
    const regexPattern = new RegExp(datePattern);
    const filteredList = user.list.filter((item) => regexPattern.test(item.date));
    return res.status(200).json({message: "Filtered Todo List by Date Successfully", data: filteredList.length, filteredList,});
  }catch (err) {
    return res.status(500).json({message: "Error fetching filtered Todo List by Date", err});
  }
};

exports.uploadPicture = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
      return errorResMsg(res, 400, "User not found");
    }
    const result = await cloudinary.v2.uploader.upload(req.file.path);
    const updatedUser = await User.findByIdAndUpdate(
      {
        _id: req.params.id,
      },
      { profilePic: result.secure_url },
      {
        isNew: true,
      }
    );

    return res
      .status(200)
      .json({
        message: "Profile Pictur Saved Successfully",
        data: updatedUser,
      });
  } catch (err) {
    // console.log(error);
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error Uploading Profile Picture", err });
  }
};