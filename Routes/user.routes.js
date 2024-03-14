const express = require('express');
const { signup, addList, updateListDescription, updateEmail, completedTodo, getAllList, getAllListAndPaginate, completedToDoList, filteredByDescription, filteredByDate, resendOtp, uploadPicture } = require("../Controller/user.controller");
const login = require('../Controller/user.login');
const isVerifyOtp = require('../Controller/user.otp-verification');
const upload = require('../public/image/multer');
const router = express.Router();


router.get("/getalllist/:id", getAllList);
router.post("/signup", signup);
router.post("/verify", isVerifyOtp);
router.post("/newotp", resendOtp);
router.post("/login", login);
router.post("/addlist/:id", addList)
router.put("/updatedescription/:id/:listId", updateListDescription);
router.put("/updateemail/:id", updateEmail);
router.put("/completedtodo/:id/:listId", completedTodo);
router.get("/getallandpagination/:id", getAllListAndPaginate);
router.get("/completedtodolist/:id", completedToDoList);
router.get("/:id/filterByDescription", filteredByDescription);
router.get("/filteredbydate/:id", filteredByDate);
router.put("/profilepic/:id", upload.single("profilePic"), uploadPicture);


module.exports = router;