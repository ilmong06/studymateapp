const db = require('../config/db');

// 목표 목록 조회
const getGoals = async (req, res) => {
    try {
        const query = 'SELECT * FROM weekly_goals WHERE user_id = ?';
        const goals = await db.executeQuery(query, [req.user.id]);
        res.status(200).json({ success: true, goals });
    } catch (error) {
        console.error('목표 조회 오류:', error);
        res.status(500).json({ success: false, message: '목표 목록을 가져오는 데 실패했습니다.' });
    }
};

// 목표 추가
const addGoal = async (req, res) => {
    const { goal_name, start_date, end_date } = req.body;

    // 필수 데이터 검증
    if (!goal_name || !start_date || !end_date) {
        return res.status(400).json({ success: false, message: '목표 이름, 시작 날짜, 종료 날짜는 필수 항목입니다.' });
    }

    try {
        // 동일 기간 목표가 있는지 확인
        const queryCheck = 'SELECT goal_id FROM weekly_goals WHERE user_id = ? AND start_date = ? AND end_date = ?';
        const existingGoals = await db.executeQuery(queryCheck, [req.user.id, start_date, end_date]) || [];

        let goal_id;

        if (existingGoals.length > 0) {
            // 기존 goal_id 사용
            goal_id = existingGoals[0]?.goal_id;
        } else {
            // 새로운 goal_id 생성
            const queryMax = 'SELECT MAX(goal_id) AS max_id FROM weekly_goals';
            const [maxGoalId] = await db.executeQuery(queryMax) || [{}];
            goal_id = (maxGoalId?.max_id || 0) + 1;
        }

        // 새 목표 추가
        const queryInsert = 'INSERT INTO weekly_goals (user_id, goal_id, goal_name, start_date, end_date, is_completed) VALUES (?, ?, ?, ?, ?, ?)';
        const result = await db.executeQuery(queryInsert, [req.user.id, goal_id, goal_name, start_date, end_date, 0]);

        // 추가된 목표 반환
        const newGoal = {
            id: result.insertId,
            user_id: req.user.id,
            goal_id,
            goal_name,
            start_date,
            end_date,
            is_completed: 0,
        };

        res.status(201).json({ success: true, goal: newGoal });
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
        const queryUpdate = 'UPDATE weekly_goals SET is_completed = ? WHERE id = ? AND user_id = ?';
        const result = await db.executeQuery(queryUpdate, [is_completed, id, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '목표를 찾을 수 없습니다.' });
        }

        const querySelect = 'SELECT * FROM weekly_goals WHERE id = ? AND user_id = ?';
        const [updatedGoal] = await db.executeQuery(querySelect, [id, req.user.id]);

        res.status(200).json({ success: true, goal: [updatedGoal] });
    } catch (error) {
        console.error('목표 상태 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '목표 상태를 업데이트하는 데 실패했습니다.' });
    }
};

module.exports = { getGoals, addGoal, updateGoalStatus };
