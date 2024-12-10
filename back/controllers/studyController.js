const mysql = require('mysql2/promise');
const verifyToken = require('../middlewares/authMiddleware');
require('dotenv').config();

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'studymate',
});

// 학습 목표 가져오기
const getGoals = async (req, res) => {
  const userId = req.user.id;
  try {
    const [goals] = await pool.query(
      'SELECT * FROM learning_goals WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json(goals);
  } catch (error) {
    console.error('학습 목표 가져오기 실패', error);
    res.status(500).json({ success: false, message: '학습 목표를 가져오는 중 문제가 발생했습니다.' });
  }
};

// 학습 목표 추가
const addGoal = async (req, res) => {
  const userId = req.user.id;
  const { goal_name, goal_type, study_date } = req.body;

  if (!goal_name || !goal_type || !study_date) {
    return res.status(400).json({ success: false, message: '목표 정보를 모두 입력해주세요.' });
  }

  try {
    const formattedStudyDate = new Date(study_date).toISOString().split('T')[0]; // 올바른 날짜 포맷 변환
    console.log('Formatted date before DB insert:', formattedStudyDate);

    const [result] = await pool.query(
      'INSERT INTO learning_goals (user_id, goal_name, goal_type, study_date) VALUES (?, ?, ?, ?)',
      [userId, goal_name, goal_type, formattedStudyDate]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      goal_name,
      goal_type,
      study_date: formattedStudyDate,
    });
  } catch (error) {
    console.error('목표 추가 실패', error);
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
    console.error('목표 상태 변경 중 오류', error);
    res.status(500).json({ success: false, message: '목표 상태를 업데이트하는 중 문제가 발생했습니다.' });
  }
};

module.exports = {
  getGoals,
  addGoal,
  toggleGoalCompletion,
};
