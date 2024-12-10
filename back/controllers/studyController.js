const mysql = require('mysql2/promise');
const verifyToken = require('../middlewares/authMiddleware');
require('dotenv').config();

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',  // 실제 MySQL 사용자 이름으로 변경
    password: '',  // 실제 MySQL 비밀번호로 변경
    database: 'studymate', // 데이터베이스 이름
});

module.exports = pool;


// 학습 목표 가져오기
const getGoals = async (req, res) => {
    const userId = req.user.id; // JWT에서 추출된 사용자 ID
    console.log('JWT user.ID:', req.user.id);
    try {
        const [goals] = await pool.query(
            'SELECT * FROM learning_goals WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.status(200).json(goals);
    } catch (error) {
        console.error('학습 목표 가져오기 오류:', error);
        res.status(500).json({ success: false, message: '학습 목표를 가져오는 중 문제가 발생했습니다.' });
    }
};

// 학습 목표 추가
const addGoal = async (req, res) => {
    const userId = req.user.id;
    const { goal_name, goal_type } = req.body;

    if (!goal_name || !goal_type) {
        return res.status(400).json({ success: false, message: '목표 이름과 유형이 필요합니다.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO learning_goals (user_id, goal_name, goal_type) VALUES (?, ?, ?)',
            [userId, goal_name, goal_type]
        );
        res.status(201).json({
            id: result.insertId,
            user_id: userId,
            goal_name,
            goal_type,
            is_completed: 0,
            created_at: new Date(),
        });
    } catch (error) {
        console.error('학습 목표 추가 오류:', error);
        res.status(500).json({ success: false, message: '목표를 추가하는 중 문제가 발생했습니다.' });
    }
};

// 목표 완료 상태 변경
const toggleGoalCompletion = async (req, res) => {
    const userId = req.user.id;
    const { goalId } = req.params;
    const { is_completed } = req.body;

    try {
        await pool.query(
            'UPDATE learning_goals SET is_completed = ? WHERE id = ? AND user_id = ?',
            [is_completed, goalId, userId]
        );
        res.status(200).json({ success: true, message: '목표 상태가 업데이트되었습니다.' });
    } catch (error) {
        console.error('목표 상태 변경 오류:', error);
        res.status(500).json({ success: false, message: '목표 상태를 업데이트하는 중 문제가 발생했습니다.' });
    }
};

// 학습 시간 로그 가져오기
const getTimeLogs = async (req, res) => {
    const userId = req.user.id;

    try {
        const [timeLogs] = await pool.query(
            'SELECT * FROM learning_time_logs WHERE user_id = ? ORDER BY study_date DESC',
            [userId]
        );
        res.status(200).json(timeLogs);
    } catch (error) {
        console.error('학습 시간 로그 가져오기 오류:', error);
        res.status(500).json({ success: false, message: '학습 시간을 가져오는 중 문제가 발생했습니다.' });
    }
};

// 학습 시간 기록
const logStudyTime = async (req, res) => {
    const userId = req.user.id;
    const { study_date, study_time_minutes } = req.body;

    if (!study_date || !study_time_minutes) {
        return res.status(400).json({ success: false, message: '학습 날짜와 시간이 필요합니다.' });
    }

    try {
        await pool.query(
            `INSERT INTO learning_time_logs (user_id, study_date, study_time_minutes)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE study_time_minutes = ?`,
            [userId, study_date, study_time_minutes, study_time_minutes]
        );
        res.status(201).json({ success: true, message: '학습 시간이 기록되었습니다.' });
    } catch (error) {
        console.error('학습 시간 기록 오류:', error);
        res.status(500).json({ success: false, message: '학습 시간을 기록하는 중 문제가 발생했습니다.' });
    }
};

module.exports = {
    getGoals,
    addGoal,
    toggleGoalCompletion,
    getTimeLogs,
    logStudyTime,
};
