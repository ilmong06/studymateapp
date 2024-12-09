// generateJwtSecret.js
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const jwtSecret = crypto.randomBytes(64).toString('hex');

// .env 파일에 저장
const envFilePath = path.join(__dirname, '../../.env');
fs.appendFileSync(envFilePath, `JWT_SECRET=${jwtSecret}\n`);

console.log('JWT Secret Key generated and saved to .env file.');
