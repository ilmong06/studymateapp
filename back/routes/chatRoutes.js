const express = require('express');
const {
    getChatRooms
} = require('../controllers/chatController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

// 채팅방 리스트 불러오기
router.get('/rooms', verifyToken, getChatRooms);

module.exports = router;
