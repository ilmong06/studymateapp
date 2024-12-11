const db = require('../config/db');

// 과목 추가
const addSubject = async (req, res) => {
    const userId = req.user.id; // 미들웨어에서 사용자 정보 추출
    const { subject_name } = req.body;

    if (!subject_name) {
        return res.status(400).json({ success: false, message: '과목 이름을 입력해주세요.' });
    }

    try {
        const query = 'INSERT INTO subjects (user_id, subject_name) VALUES (?, ?)';
        const result = await db.executeQuery(query, [userId, subject_name]);

        res.status(201).json({
            success: true,
            subject: {
                id: result.insertId,
                user_id: userId,
                subject_name,
            },
        });
    } catch (error) {
        console.error('과목 추가 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

// 과목 조회
const getSubjects = async (req, res) => {
    const userId = req.user.id; // 미들웨어에서 사용자 정보 추출

    try {
        const query = 'SELECT * FROM subjects WHERE user_id = ?';
        const subjects = await db.executeQuery(query, [userId]);

        res.status(200).json({ success: true, subjects });
    } catch (error) {
        console.error('과목 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

module.exports = {
    addSubject,
    getSubjects,
};
