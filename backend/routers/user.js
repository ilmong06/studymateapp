const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL 연결 설정
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',  // 실제 MySQL 사용자 이름으로 변경
    password: '',  // 실제 MySQL 비밀번호로 변경
    database: 'studymate', // 데이터베이스 이름
});

// 사용자 정보 가져오기 API
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;

    pool.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('MySQL 쿼리 오류:', err);
            return res.status(500).json({ success: false, message: '데이터베이스 오류' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        res.json({ success: true, user: results[0] });
    });
});

const PORT = 3009;
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
