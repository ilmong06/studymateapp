const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const { getGoals, addGoal, updateGoalStatus } = require('../controllers/weeklyStudyController');

// 목표 목록 조회
router.get('/goals', verifyToken, getGoals);

// 목표 추가
router.post('/goals', verifyToken, addGoal);

// 목표 완료 상태 업데이트
router.put('/goals/:id', verifyToken, updateGoalStatus);

module.exports = router;