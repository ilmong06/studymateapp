const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'studymate',
});

// 타이머 시작
exports.startTimer = async (req, res) => {
    const { subject_id } = req.body;
    const user_id = req.user.id;

    try {
        // 타이머가 이미 실행 중인지 확인
        const [existingTimer] = await pool.query('SELECT * FROM timers WHERE user_id = ? AND subject_id = ? AND is_running = TRUE', [user_id, subject_id]);
        if (existingTimer.length > 0) {
            return res.status(400).json({ success: false, message: '이미 타이머가 실행 중입니다.' });
        }

        // 타이머 시작
        const [result] = await pool.query('INSERT INTO timers (user_id, subject_id, is_running, start_time) VALUES (?, ?, TRUE, CURRENT_TIMESTAMP)', [user_id, subject_id]);
        res.json({ success: true, message: '타이머가 시작되었습니다.', timerId: result.insertId });
    } catch (error) {
        console.error('타이머 시작 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// 타이머 정지
exports.stopTimer = async (req, res) => {
    const { id } = req.body;
    const user_id = req.user.id;

    try {
        // 실행 중인 타이머가 있는지 확인
        const [existingTimer] = await pool.query('SELECT * FROM timers WHERE id = ? AND user_id = ? AND is_running = TRUE', [id, user_id]);
        if (existingTimer.length === 0) {
            return res.status(400).json({ success: false, message: '실행 중인 타이머가 아닙니다.' });
        }

        // 타이머 종료 및 종료 시간 기록
        await pool.query('UPDATE timers SET is_running = FALSE, end_time = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [id, user_id]);
        res.json({ success: true, message: '타이머가 정지되었습니다.' });
    } catch (error) {
        console.error('타이머 정지 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// 사용자 타이머 조회
exports.getTimers = async (req, res) => {
    const user_id = req.user.id;

    try {
        const [timers] = await pool.query('SELECT * FROM timers WHERE user_id = ?', [user_id]);
        res.json({ success: true, timers });
    } catch (error) {
        console.error('타이머 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};
