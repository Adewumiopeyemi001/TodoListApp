const express = require('express');
const { signup, login, addList, updateListDescription, updateEmail, completedTodo, getAllList, getAllListAndPaginate, completedToDoList, filteredByDescription, filteredByDate, isVerifyOtp, resendOtp } = require("../Controller/user.controller");
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


module.exports = router;