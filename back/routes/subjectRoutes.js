const express = require('express');
const router = express.Router();
const { addSubject, getSubjects } = require('../controllers/subjectController');
const verifyToken = require('../middlewares/authMiddleware');  // 미들웨어 추가

router.post('/add', verifyToken, addSubject); // 과목 추가
router.get('/', verifyToken, getSubjects); // 사용자 과목 조회

module.exports = router;
