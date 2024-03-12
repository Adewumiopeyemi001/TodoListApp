const express = require('express');
const { signup, login, allUsers } = require('../Controller/admin.controller');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/getusers', isAuthenticated, allUsers);




module.exports = router;