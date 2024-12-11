const mysql = require('mysql2');

// MySQL 연결 풀 생성
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'studymate',
});

const promisePool = pool.promise();

// 목표 목록 조회
const getGoals = async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT * FROM weekly_goals WHERE user_id = ?', [req.user.id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('목표 조회 오류:', error);
        res.status(500).json({ success: false, message: '목표 목록을 가져오는 데 실패했습니다.' });
    }
};

// 목표 추가
const addGoal = async (req, res) => {
    const { goal_name, start_date, end_date } = req.body;

    if (!goal_name || !start_date || !end_date) {
        return res.status(400).json({ success: false, message: '목표 이름, 시작 날짜, 종료 날짜는 필수 항목입니다.' });
    }

    try {
        const [result] = await promisePool.query(
            'INSERT INTO weekly_goals (user_id, goal_name, start_date, end_date, is_completed) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, goal_name, start_date, end_date, 0]
        );

        const newGoal = {
            id: result.insertId,
            user_id: req.user.id,
            goal_name,
            start_date,
            end_date,
            is_completed: 0,
        };

        res.status(201).json(newGoal);
    } catch (error) {
        console.error('목표 추가 오류:', error);
        res.status(500).json({ success: false, message: '목표를 추가하는 데 실패했습니다.' });
    }
};

// 목표 완료 상태 업데이트
const updateGoalStatus = async (req, res) => {
    const { id } = req.params;
    const { is_completed } = req.body;

    if (is_completed === undefined) {
        return res.status(400).json({ success: false, message: 'is_completed 값이 필요합니다.' });
    }

    try {
        const [result] = await promisePool.query(
            'UPDATE weekly_goals SET is_completed = ? WHERE id = ? AND user_id = ?',
            [is_completed, id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '목표를 찾을 수 없습니다.' });
        }

        const [updatedGoal] = await promisePool.query(
            'SELECT * FROM weekly_goals WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        res.status(200).json(updatedGoal[0]);
    } catch (error) {
        console.error('목표 상태 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '목표 상태를 업데이트하는 데 실패했습니다.' });
    }
};

module.exports = { getGoals, addGoal, updateGoalStatus };
