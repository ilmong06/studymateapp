const express = require('express');
const {
    getGoals,
    addGoal,
    toggleGoalCompletion,
    getTimeLogs,
    logStudyTime,
} = require('../controllers/studyController'); // studyController import
const verifyToken = require('../middlewares/authMiddleware'); // JWT 인증 미들웨어

const router = express.Router();

// 학습 목표 가져오기
router.get('/goals', verifyToken, getGoals);

// 학습 목표 추가
router.post('/goals', verifyToken, addGoal);

// 학습 목표 완료 상태 변경
router.put('/goals/:goalId', verifyToken, toggleGoalCompletion);

// 학습 시간 로그 가져오기
router.get('/time-logs', verifyToken, getTimeLogs);

// 학습 시간 기록
router.post('/time-logs', verifyToken, logStudyTime);

module.exports = router;
