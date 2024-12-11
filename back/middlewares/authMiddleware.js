const jwt = require('jsonwebtoken');
const db = require('../config/db'); // 데이터베이스 설정 파일

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Authorization header가 필요합니다.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 무효화된 토큰인지 확인
        const result = await db.executeQuery(
            'SELECT id FROM invalid_tokens WHERE token = ?',
            [token]
        );

        if (result && result.length > 0) {
            return res.status(401).json({ success: false, message: '이 토큰은 더 이상 유효하지 않습니다.' });
        }

        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 사용자 정보 저장
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: '토큰이 만료되었습니다.' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        } else {
            console.error('토큰 검증 중 오류:', error);
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    }
};

module.exports = verifyToken;
