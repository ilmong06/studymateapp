const express = require('express');
const {
    updateUser,
    getUsername,
    deleteUser,
} = require('../controllers/userController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/update-user', verifyToken, updateUser); // Update user details
router.get('/getUsername', verifyToken, getUsername); // Get username
router.delete('/delete-user', verifyToken, deleteUser); // Delete user

module.exports = router;
