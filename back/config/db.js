const mysql = require('mysql2');
require('dotenv').config();

// 데이터베이스 연결 설정
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,       // MySQL 서버 주소
    user: process.env.DATABASE_USER,            // MySQL 사용자
    password: process.env.DATABASE_PASSWORD,    // MySQL 비밀번호
    database: process.env.DATABASE_NAME, // 데이터베이스 이름
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 프로미스를 사용하기 위해 Promise로 래핑
const promisePool = pool.promise();

// 쿼리 실행 함수
const executeQuery = async (query, params = []) => {
    try {
        const [rows] = await promisePool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('DB Query Error:', error);
        throw error;
    }
};

// 연결 테스트 함수
const testConnection = async () => {
    try {
        const [rows] = await promisePool.execute('SELECT 1');
        console.log('DB Connection Test:', rows);
    } catch (error) {
        console.error('DB Connection Error:', error);
    }
};

// 데이터베이스 연결 테스트 실행
testConnection();

module.exports = {
    executeQuery
};
