const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'studymate',
});

// 과목 추가
exports.addSubject = async (req, res) => {
    const userId = req.user.id; // 미들웨어에서 사용자 정보 추출
    const { subject_name } = req.body;

    if (!subject_name) {
        return res.status(400).json({ success: false, message: '과목 이름을 입력해주세요.' });
    }

    try {
        // 과목 추가 DB 로직
        await pool.query('INSERT INTO subjects (user_id, subject_name) VALUES (?, ?)', [userId, subject_name]);
        res.status(201).json({ success: true, message: '과목이 추가되었습니다.' });
    } catch (error) {
        console.error('과목 추가 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// controllers/subjectController.js

// 과목 조회
exports.getSubjects = async (req, res) => {
    const userId = req.user.id; // 미들웨어에서 사용자 정보 추출

    try {
        // subjects와 함께 timers 테이블에서 필요한 정보를 가져옵니다.
        const [subjects] = await pool.query(`
            SELECT s.id, s.subject_name, t.id AS timer_id, t.is_running
            FROM subjects s
            LEFT JOIN timers t ON s.id = t.subject_id AND t.user_id = ?
            WHERE s.user_id = ?
        `, [userId, userId]);

        res.status(200).json({ success: true, subjects });
    } catch (error) {
        console.error('과목 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};


// 서버 코드: 과목 이름 조회
exports.getSubjectById = async (req, res) => {
    const { subjectId } = req.params;
    const userId = req.user.id; // 미들웨어에서 사용자 정보 추출

    try {
        const [rows] = await pool.query('SELECT subject_name FROM subjects WHERE id = ? AND user_id = ?', [subjectId, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '과목을 찾을 수 없습니다.' });
        }

        res.status(200).json({ success: true, subject_name: rows[0].subject_name });
    } catch (error) {
        console.error('과목 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};
