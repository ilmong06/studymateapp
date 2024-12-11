const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const {
    getFriends,
    searchFriend,
    sendFriendRequest,
    deleteFriend,
    getPlusFriends,
} = require('../controllers/friendController');

// 친구 목록 불러오기
router.get('/', verifyToken, getFriends);

// 친구 검색
router.get('/search', verifyToken, searchFriend);

// 친구 요청 전송
router.post('/request', verifyToken, sendFriendRequest);

// 친구 삭제
router.delete('/:friendId', verifyToken, deleteFriend);

// 친구 요청 목록 불러오기
router.get('/pending', verifyToken, getPlusFriends);

module.exports = router;



