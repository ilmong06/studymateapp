const db = require('../config/db');
const bcrypt = require('bcrypt');

// 사용자 정보 업데이트
const updateUser = async (req, res) => {
    const { currentPassword, newPassword, email } = req.body;
    try {
        // 현재 비밀번호 확인
        const query = 'SELECT password_hash FROM users WHERE username = ?';
        const user = await db.executeQuery(query, [req.user]);

        if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
            return res.status(401).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        // 새 비밀번호 해싱
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // 사용자 정보 업데이트
        const updateQuery = 'UPDATE users SET password_hash = ?, email = ? WHERE username = ?';
        await db.executeQuery(updateQuery, [hashedPassword, email, req.user]);

        res.status(200).json({ success: true, message: '사용자 정보가 성공적으로 업데이트되었습니다.' });
    } catch (error) {
        console.error('사용자 정보 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '사용자 정보를 업데이트하는 데 실패했습니다.' });
    }
};

// 사용자 이름 가져오기
const getUsername = async (req, res) => {
    try {
        const query = 'SELECT username FROM users WHERE username = ?';
        const [user] = await db.executeQuery(query, [req.user]);

        if (!user) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json({ success: true, username: user.username });
    } catch (error) {
        console.error('사용자 이름 조회 오류:', error);
        res.status(500).json({ success: false, message: '사용자 이름을 가져오는 데 실패했습니다.' });
    }
};

// 사용자 삭제
const deleteUser = async (req, res) => {
    const { password } = req.body;
    try {
        // 비밀번호 확인
        const query = 'SELECT password_hash FROM users WHERE username = ?';
        const user = await db.executeQuery(query, [req.user]);

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }

        // 사용자 삭제
        await db.executeQuery('DELETE FROM users WHERE username = ?', [req.user]);
        res.status(200).json({ success: true, message: '사용자가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('사용자 삭제 오류:', error);
        res.status(500).json({ success: false, message: '사용자를 삭제하는 데 실패했습니다.' });
    }
};

module.exports = { updateUser, getUsername, deleteUser };
