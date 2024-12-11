const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();
const crypto = require('crypto');
const tokenUrl = "https://nid.naver.com/oauth2.0/token";
const userInfoUrl = "https://openapi.naver.com/v1/nid/me";

// CORS 설정 추가
const corsOptions = {
    origin: 'http://121.127.165.43:19006', // 프론트엔드 주소
    methods: 'GET,POST',
};

// Access Token 생성
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Access Token 만료 시간
    );
};
// Refresh Token 생성
const generateRefreshToken = async (user) => {
    const refreshToken = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '14d' } // 7일 유효
    );
    // Refresh Token 해싱
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    return { refreshToken, hashedRefreshToken };
};

// 일반 로그인
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 데이터베이스에서 사용자 조회
        const [userRows] = await db.executeQuery(
            'SELECT * FROM users WHERE username = ? LIMIT 1',
            [username]
        );

        // 사용자 데이터 확인
        if (!userRows || userRows.length === 0) {
            return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        // user 변수 초기화
        const user = userRows;
        console.log('조회된 사용자:', user);

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: '비밀번호가 올바르지 않습니다.' });
        }

        const token = generateAccessToken(user);
        const {refreshToken, hashedRefreshToken} = await generateRefreshToken(user);

        // Refresh Token을 데이터베이스에 해싱하여 저장
        await db.executeQuery('UPDATE users SET refresh_token = ? WHERE id = ?', [
            hashedRefreshToken,
            user.id,
        ]);

        res.status(200).json({
            success: true,
            accessToken: String(token),
            refreshToken: String(refreshToken),
            user: { id: user.id, username: user.username, email: user.email },
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ success: false, message: '로그인 중 오류가 발생했습니다.' });
    }
};

// 네이버 소셜 로그인
const naverLogin = async (req, res) => {
    const { code } = req.query; // 프론트엔드에서 전달된 code

    if (!code) {
        return res.status(400).json({ success: false, message: 'Authorization Code가 제공되지 않았습니다.' });
    }

    try {
        // 네이버 토큰 요청
        const tokenResponse = await axios.post(
            'https://nid.naver.com/oauth2.0/token',
            null,
            {
                params: {
                    grant_type: 'authorization_code',
                    client_id: process.env.NAVER_CLIENT_ID,
                    client_secret: process.env.NAVER_CLIENT_SECRET,
                    redirect_uri: encodeURIComponent(process.env.NAVER_REDIRECT_URI),
                    code,
                },
            }
        );
        const { access_token: accessToken, refresh_token: refreshToken } = tokenResponse.data;

        // 네이버 사용자 프로필 요청
        const profileResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const profile = profileResponse.data.response;

        // 프로필 데이터 검증
        if (!profile || !profile.id) {
            return res.status(500).json({ success: false, message: '네이버 프로필 데이터가 불완전합니다.' });
        }

        const {
            id,
            email,
            nickname,
            profile_image: profileImage,
        } = profile;

        // 사용자 조회
        const userRows = await db.executeQuery(
            'SELECT * FROM users WHERE social_provider = ? AND social_id = ?',
            ['naver', String(id)]
        );

        let userId;

        if (userRows.length === 0) {
            // 새 사용자 생성
            const [result] = await db.executeQuery(
                'INSERT INTO users (username, email, social_id, social_provider, refresh_token) VALUES (?, ?, ?, ?, ?)',
                [nickname || `naver_${id}`, email || null, id, 'naver', refreshToken]
            );
            userId = result.insertId;
        } else {
            // 기존 사용자 ID 가져오기 및 refreshToken 업데이트
            const existingUser = userRows[0];
            userId = existingUser.id;
            await db.executeQuery(
                'UPDATE users SET refresh_token = ? WHERE id = ?',
                [refreshToken, userId]
            );
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            { id: userId, username: nickname || name, email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // 1시간 유효
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: userId,
                username: nickname || name,
                email,
            },
        });

        console.log('네이버 소셜 로그인 성공');
    } catch (error) {
        console.error('네이버 로그인 오류:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: '네이버 로그인 중 오류가 발생했습니다.' });
    }
};


// 카카오 소셜 로그인
const kakaoLogin = async (req, res) => {
    const { code } = req.query; // 프론트엔드에서 전달된 code

    if (!code) {
        return res.status(400).json({ success: false, message: 'Authorization Code가 제공되지 않았습니다.' });
    }

    try {
        // 카카오 토큰 요청
        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.KAKAO_CLIENT_ID,
                redirect_uri: process.env.KAKAO_REDIRECT_URI,
                code,
            },
        });

        const { access_token: accessToken, refresh_token: refreshToken } = tokenResponse.data;

        // 카카오 프로필 요청
        const profileResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const profile = profileResponse.data;

        // Check if required fields exist
        if (!profile.id || !profile.kakao_account) {
            return res.status(500).json({ success: false, message: '카카오 프로필 데이터가 불완전합니다.' });
        }

        const { id, kakao_account } = profile;
        const email = kakao_account.email || null;
        const nickname = kakao_account.profile?.nickname || `kakao_${id}`;
        const profileImage = kakao_account.profile?.profile_image_url || null;

        // 사용자 조회
        const userRows = await db.executeQuery(
            'SELECT * FROM users WHERE social_provider = ? AND social_id = ?',
            ['kakao', id]
        );

        let userId;

        if (userRows.length === 0) {
            // 새 사용자 생성
            const [result] = await db.executeQuery(
                'INSERT INTO users (username, email, social_id, social_provider, refresh_token) VALUES (?, ?, ?, ?, ?)',
                [nickname, email, id, 'kakao', refreshToken]
            );
            userId = result.insertId;
        } else {
            // 기존 사용자 ID 가져오기 및 refreshToken 업데이트
            const existingUser = userRows[0];
            userId = existingUser.id;
            await db.executeQuery(
                'UPDATE users SET refresh_token = ? WHERE id = ?',
                [refreshToken, userId]
            );
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            { id: userId, username: nickname, email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // 1시간 유효
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: userId,
                username: nickname,
                email,
            },
        });
        console.log("카카오 소셜 로그인 성공");

    } catch (error) {
        console.error('카카오 로그인 오류:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: '카카오 로그인 중 오류가 발생했습니다.' });
    }
};

const resetPassword = async (req, res) => {
    const { email, userId, newPassword } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.executeQuery(
            `UPDATE users SET password_hash = ? WHERE email = ? AND username = ?`,
            [hashedPassword, email, userId]
        );

        res.status(200).json({ success: true, message: '비밀번호가 성공적으로 재설정되었습니다.' });
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        res.status(500).json({ success: false, message: '비밀번호 재설정에 실패했습니다.' });
    }
};

const checkUsername = async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: '아이디를 입력해주세요' });
    }

    try {
        const [results] = await db.executeQuery('SELECT COUNT(*) AS count FROM users WHERE username = ?', [username]);

        if (results.length > 0) {
            return res.status(400).json({ message: '이미 사용 중인 아이디입니다' });
        }

        return res.status(200).json({ available: true });
    } catch (error) {
        console.error('DB 오류:', error);
        return res.status(500).json({ message: '서버 오류, 다시 시도해주세요.' });
    }
};

// 인증 코드 발송
const sendAuthCode = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ success: false, message: '이메일은 필수 입력 항목입니다.' });
        }
        // 인증 코드 생성 (6자리 숫자)
        const code = crypto.randomInt(100000, 999999).toString();

        // 인증 코드 만료 시간을 10분으로 설정
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // 이메일 전송 설정
        const transporter = nodemailer.createTransport({
            host: 'smtp.naver.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.NAVER_EMAIL,
                pass: process.env.NAVER_PASSWORD,
            },
        });

        // 인증 코드 발송
        await transporter.sendMail({
            from: process.env.NAVER_EMAIL,
            to: email,
            subject: 'StudyMate 인증 코드',
            text: `StudyMate 인증 코드: ${code}. 인증 코드는 10분간 유효합니다.`,
        });

        // 인증 코드 저장
        await db.executeQuery(
            `INSERT INTO verification_codes (email, code, expires_at, created_at)
             VALUES (?, ?, ?, NOW())`,
            [email, code, expiresAt]
        );

        res.status(200).json({ success: true, message: '인증 코드가 이메일로 발송되었습니다.' });
    } catch (error) {
        console.error('인증 코드 발송 오류:', error);
        res.status(500).json({ success: false, message: '이메일 전송에 실패했습니다.' });
    }
};


// 인증 코드 확인
const verifyAuthCode = async (req, res) => {
    const { email, authCode } = req.body;

    try {
        // 인증 코드 확인 및 username 조회
        const [verification] = await db.executeQuery(
            `SELECT vc.code, u.username
             FROM verification_codes vc
                      JOIN users u ON u.email = vc.email
             WHERE vc.email = ? AND vc.code = ? AND vc.expires_at > NOW()`,
            [email, authCode]
        );

        if (verification.length === 0) {
            return res.status(400).json({ success: false, message: '유효하지 않은 인증 코드입니다.' });
        }

        const username = verification[0].username;

        res.status(200).json({
            success: true,
            message: '인증 코드가 확인되었습니다.',
            username: username, // 응답에 username 포함
        });
    } catch (error) {
        console.error('인증 코드 확인 오류:', error);
        res.status(500).json({ success: false, message: '인증 코드 확인에 실패했습니다.' });
    }
};


// 회원가입 처리
const register = async (req, res) => {
    const { username, password, name, birthdate, phoneNumber, email } = req.body;

    if (!username || !password || !name || !birthdate || !phoneNumber || !email) {
        return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }

    try {
        // 비밀번호 해싱 처리
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 등록 쿼리
        const result = await db.executeQuery(
            'INSERT INTO users (username, password_hash, name, birth_date, phone_number, email) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, name, birthdate, phoneNumber, email]
        );

        // 응답
        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            user: { id: result.insertId, username: username, email: email }
        });

    } catch (error) {
        console.error('회원가입 처리 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류, 다시 시도해주세요.' });
    }
};

const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh Token이 제공되지 않았습니다.' });
    }

    try {
        // Refresh Token 검증
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        console.log('Decoded Refresh Token:', decoded);

        // 사용자 확인
        const userRows = await db.executeQuery(
            'SELECT * FROM users WHERE id = ? AND refresh_token IS NOT NULL',
            [decoded.id]
        );

        if (!userRows || userRows.length === 0) {
            console.error('User not found or invalid token:', userRows);
            return res.status(403).json({ success: false, message: '유효하지 않은 Refresh Token입니다.' });
        }

        const user = userRows[0];
        console.log('조회된 사용자:', user);

        // Refresh Token 값 검증
        console.log('Database Stored Refresh Token:', user.refresh_token);
        console.log('Incoming Refresh Token:', refreshToken);

        const isTokenValid = await bcrypt.compare(refreshToken, user.refresh_token);
        console.log('Refresh Token 검증 결과:', isTokenValid);

        if (!isTokenValid) {
            console.error('Refresh Token mismatch');
            return res.status(403).json({ success: false, message: '유효하지 않은 Refresh Token입니다.' });
        }

        // 새로운 Access Token 생성
        const newAccessToken = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            success: true,
            accessToken: String(newAccessToken),
        });
    } catch (error) {
        console.error('Refresh Token 검증 실패:', error.message);
        return res.status(403).json({ success: false, message: 'Refresh Token이 유효하지 않습니다.' });
    }
};

// 아이디 검색 및 인증 코드 확인 엔드포인트
const searchId = async (req, res) => {
    const { email, authCode } = req.body;

    try {
        // 이메일과 인증 코드 확인
        const [verification] = await db.executeQuery(
            `SELECT code FROM verification_codes WHERE email = ? AND code = ? AND expires_at > NOW()`,
            [email, authCode]
        );

        if (verification.length === 0) {
            return res.status(400).json({ success: false, message: '유효하지 않은 인증 코드입니다.' });
        }

        // 이메일로 아이디(username) 검색
        const user = await db.executeQuery(
            `SELECT username FROM users WHERE email = ?`,
            [email]
        );

        if (user.length === 0) {
            return res.status(404).json({ success: false, message: '해당 이메일로 등록된 계정이 없습니다.' });
        }

        const { username } = user;
        res.status(200).json({ success: true, username, message: '인증 코드가 확인되었으며, 아이디를 찾았습니다.' });
    } catch (error) {
        console.error('아이디 검색 및 인증 코드 확인 오류:', error);
        res.status(500).json({ success: false, message: '아이디 검색 및 인증 코드 확인에 실패했습니다.' });
    }
};

const getUserInfo = async (req, res) => {
    try {
        // Authorization 헤더에서 토큰 가져오기
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: '토큰이 제공되지 않았습니다.' });
        }

        const token = authHeader.split(' ')[1]; // "Bearer <token>" 형식에서 토큰만 추출

        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 사용자 정보 조회
        const [userRows] = await db.executeQuery('SELECT id, username, email FROM users WHERE id = ?', [
            decoded.id,
        ]);

        const user = userRows;
        if (!user) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        // 사용자 정보 반환
        res.status(200).json({
            success: true,
            id: user.id,
            username: user.username,
            email: user.email,
        });
    } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
};

const logout = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer 토큰에서 실제 토큰 추출

    if (!token) {
        return res.status(401).json({ success: false, message: '토큰이 제공되지 않았습니다.' });
    }

    try {
        // 토큰의 유효성 검사
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 토큰 무효화 처리
        await db.executeQuery(
            `INSERT INTO invalid_tokens (token, user_id, expires_at) VALUES (?, ?, ?)`,
            [token, decoded.id, new Date(decoded.exp * 1000)] // JWT 만료 시간을 저장
        );

        res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('로그아웃 처리 오류:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }

        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
}

module.exports = {
    login,
    naverLogin,
    kakaoLogin,
    sendAuthCode,
    verifyAuthCode,
    resetPassword,
    checkUsername,
    register,
    refreshToken,
    getUserInfo,
    corsOptions,
    searchId,
    logout
};
