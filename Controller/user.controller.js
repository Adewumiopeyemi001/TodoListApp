const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/user.schema");
const emailSender = require('../middleware/email');
// const user = require("../models/user.schema");
// const user = require("../models/user.schema");


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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      userName,
      password: hashedPassword,
      email,
      otp,
    });

    await newUser.save();

await emailSender(email, userName, otp);

    return res
      .status(201)
      .json({ message: "User saved successfully", newUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error saving user", err });
  }
};

exports.login = async (req, res) => {
  try {
    const {userName, password} = req.body;
    if(!userName || !password) {
      res.status(400).json({message: "Please input your username and password"});
    }
// Find The User By Email In the Database
    const user = await User.find({ userName });
  
    // If you are not a user, sign up
    if(!user) {
      res.status(404).json({message: "User Not Found, Please SignUp"});
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