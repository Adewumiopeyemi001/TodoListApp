const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Admin = require('../Models/admin.schema');
const user = require("../models/user.schema");

const emailSender = async (email, lastName) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_USER,
        pass: process.env.GOOGLE_PASSWORD,
      },
    });
  
    const mailOptions = {
      from: process.env.GOOGLE_USER,
      to: email,
      subject: 'Welcome To TodoList App',
      text: `Welcome ${lastName} to TodoList
      You're highly welcomed.`
  
    }
  
    await transporter.sendMail(mailOptions)
  };
  

exports.signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password} = req.body;
        if ( !firstName || !lastName || !email || !password) {
          return res.status(400).json({message: "Please provide firstname, lastname, email and role"});
        }

         // Password validation: Must contain at least one uppercase, one lowercase, one number, and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    const admin = await Admin.findOne({email});
    if (admin) {
      return res.status(409).json({ message: "Admin already exists" });
    };

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newAdmin = new Admin({
        firstName,
        lastName,
        email,
        password: hashedPassword,
    });
    await newAdmin.save();
    await emailSender(email, lastName);

    return res
      .status(201)
      .json({ message: "User saved successfully", newAdmin });
    }catch (err) {
        console.error(err);
    return res.status(500).json({ message: "Error saving admin", err });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if ( !email || !password ) {
            res.status(400).json({message: "Please input your email and password"});
        }

        const admin = await Admin.find({ email });

        if (!admin) {
            res.status(404).json({message: "Amin Not Found, Please SignUp"});
        }
        const correctPassword = await bcrypt.compare(password, admin[0].password);
        if (!correctPassword) {
            res.status(400).json({message: "Incorrect Password"});
        }
        console.log(admin);
        const token = jwt.sign({ adminId: admin[0]._id}, process.env.SECRET_KEY, {
            expiresIn: "2h"  // Token expiration time
          });
          return res.status(200).json({message: "User Logged in Successfully", token: token, admin});

    }catch (err) {
        console.log(err);
    return res.status(500).json({message: "Error Logging In Admin", err})
    }
};
exports.allUsers = async (req, res) => {
  try {
      const id = req.user.adminId;
      const isAdmin = await Admin.findById(id);
      if (isAdmin.role !== "Admin") {
          return res
          .status(400)
          .json({ message: "You Are Not Authorized"});
      }

    const allUsers = await user.find({}, { email: 1, userName: 1, _id: 0 });

    return res
      .status(200)
      .json({ message: "All users Fetched", data: allUsers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error Fetching Users", err });
  }
};