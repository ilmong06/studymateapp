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

// 과목 조회
exports.getSubjects = async (req, res) => {
    const userId = req.user.id; // 미들웨어에서 사용자 정보 추출

    try {
        const [subjects] = await pool.query('SELECT * FROM subjects WHERE user_id = ?', [userId]);
        res.status(200).json({ success: true, subjects });
    } catch (error) {
        console.error('과목 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};
