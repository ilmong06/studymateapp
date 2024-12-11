const db = require('../config/db');

// 학습 목표 가져오기
const getGoals = async (req, res) => {
    const userId = req.user.id;

    try {
        const query = `SELECT * FROM learning_goals WHERE user_id = ? ORDER BY created_at DESC`;
        const goals = await db.executeQuery(query, [userId]);

        res.status(200).json({ success: true, goals });
    } catch (error) {
        console.error('학습 목표 가져오기 실패:', error);
        res.status(500).json({ success: false, message: '학습 목표를 가져오는 데 실패했습니다.' });
    }
};

// 학습 목표 추가
const addGoal = async (req, res) => {
    const userId = req.user.id;
    const { goal_name, goal_type, study_date } = req.body;

    if (!goal_name || !goal_type || !study_date) {
        return res.status(400).json({ success: false, message: '모든 목표 정보를 입력해주세요.' });
    }

    try {
        const formattedStudyDate = new Date(study_date).toISOString().split('T')[0];
        const query = `INSERT INTO learning_goals (user_id, goal_name, goal_type, study_date, created_at) VALUES (?, ?, ?, ?, NOW())`;
        const result = await db.executeQuery(query, [userId, goal_name, goal_type, formattedStudyDate]);

        res.status(200).json({
            success: true,
            goal: {
                id: result.insertId,
                user_id: userId,
                goal_name,
                goal_type,
                study_date: formattedStudyDate,
            },
        });
    } catch (error) {
        console.error('학습 목표 추가 실패:', error);
        res.status(500).json({ success: false, message: '학습 목표를 추가하는 데 실패했습니다.' });
    }
};

// 목표 완료 상태 변경
const toggleGoalCompletion = async (req, res) => {
    const userId = req.user.id;
    const { goalId } = req.params;
    const { is_completed } = req.body;

    try {
        const query = `UPDATE learning_goals SET is_completed = ? WHERE id = ? AND user_id = ?`;
        await db.executeQuery(query, [is_completed, goalId, userId]);

        res.status(200).json({ success: true, message: '목표 상태가 변경되었습니다.' });
    } catch (error) {
        console.error('목표 완료 상태 변경 실패:', error);
        res.status(500).json({ success: false, message: '목표 상태 변경에 실패했습니다.' });
    }
};

module.exports = {
    getGoals,
    addGoal,
    toggleGoalCompletion,
};
