const express = require('express');
const {
    getChatRooms,
    getMessages,
    createChatRoom,
    addChatRoomMember,
    sendMessage,
    addFriend
} = require('../controllers/chatController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

// 채팅방 리스트 가져오기
router.get('/chat-rooms', verifyToken, getChatRooms);

// 채팅방 메시지 가져오기
router.get('/chat-rooms/:chatRoomId/messages', verifyToken, getMessages);

// 채팅방 생성
router.post('/chat-rooms', verifyToken, createChatRoom);

// 채팅방에 멤버 추가
router.post('/chat-rooms/:chatRoomId/members', verifyToken, addChatRoomMember);

// 메시지 보내기
router.post('/messages', verifyToken, sendMessage);

// 친구 추가
router.post('/friends', verifyToken, addFriend);

module.exports = router;
