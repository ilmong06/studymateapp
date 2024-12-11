const express = require('express');
const {
    getGoals,
    addGoal,
    toggleGoalCompletion,
} = require('../controllers/dailyStudyController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

// 학습 목표 가져오기
router.get('/goals', verifyToken, getGoals);

// 학습 목표 추가
router.post('/goals', verifyToken, addGoal);

// 목표 완료 상태 변경
router.put('/goals/:goalId', verifyToken, toggleGoalCompletion);

module.exports = router;