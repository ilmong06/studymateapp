const express = require('express');
const {
    login,
    naverLogin,
    kakaoLogin,
    sendAuthCode,
    verifyAuthCode,
    resetPassword,
    checkUsername,
    register,
    getUserInfo,
    refreshToken
} = require('../controllers/authController');

const router = express.Router();

// 일반 로그인
router.post('/login', login);

// 네이버 소셜 로그인
router.post('/naver-login', naverLogin);

// 카카오 소셜 로그인
router.get('/kakao-login', kakaoLogin);

// 이메일 인증 코드 발송
router.post('/send-code', sendAuthCode);

// 이메일 인증 코드 검증
router.post('/verify-code', verifyAuthCode);

// 비밀번호 재설정
router.post('/reset-password', resetPassword);

// 아이디 중복확인 라우트
router.post('/check-username', checkUsername);

// 회원가입 API 엔드포인트
router.post('/register', register);

// 유저 정보 가져오기
router.get('/user-info', getUserInfo);

// 토큰 리프레쉬
router.post('/refresh', refreshToken);

module.exports = router;
