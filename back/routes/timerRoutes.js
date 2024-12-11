const express = require('express');
const router = express.Router();
const { startTimer, stopTimer, getTimers } = require('../controllers/timerController');
const verifyToken = require('../middlewares/authMiddleware');  // 미들웨어 추가

// 타이머 시작
router.post('/start', verifyToken, startTimer);

// 타이머 정지
router.post('/stop', verifyToken, stopTimer);

// 타이머 조회
router.get('/', verifyToken, getTimers);

module.exports = router;
