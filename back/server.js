require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const {Server} = require('socket.io');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const friendRoutes = require('./routes/friendRoutes');
const dailyStudyRoutes = require('./routes/dailyStudyRoutes.js');
const weeklyStudyRoutes = require('./routes/weeklyStudyRoutes.js');
const subjectRoutes = require('./routes/subjectRoutes');
const timerRoutes = require('./routes/timerRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const db = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // 모든 도메인 허용
        methods: ['GET', 'POST'], // 허용할 HTTP 메서드
    },
});
app.set('io', io);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/dailyStudy', dailyStudyRoutes);
app.use('/api/weeklyStudy', weeklyStudyRoutes);
app.use('/api/subjects', subjectRoutes); // 추가
app.use('/api/timers', timerRoutes); // 추가
app.use('/api/post', postRoutes);
app.use('/api/user', userRoutes);

// 소켓 인증 미들웨어
io.use((socket, next) => {
    const token = socket.handshake.auth.token?.split(' ')[1];
    if (!token) {
        return next(new Error('인증 토큰이 없습니다.'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('유효하지 않은 토큰입니다.'));
        }
        socket.user = decoded; // 사용자 정보를 소켓 객체에 저장
        next();
    });
});

// 메시지 저장
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('sendMessage', async ({ chatRoomId, content }) => {
        try {
            const senderId = socket.user?.id; // 토큰에서 인증된 사용자 ID 가져오기
            console.log('Received message:', { chatRoomId, content, senderId });

            if (!senderId || !chatRoomId || !content) {
                console.error('Invalid data provided');
                return socket.emit('error', { success: false, message: 'Invalid data provided.' });
            }

            const query = `
                INSERT INTO messages (chat_room_id, sender_id, content, created_at)
                VALUES (?, ?, ?, NOW())
            `;
            const result = await db.executeQuery(query, [chatRoomId, senderId, content]);

            const newMessage = {
                id: result.insertId,
                chatRoomId,
                senderId,
                content,
                createdAt: new Date().toISOString(),
                username: socket.user?.username || 'Unknown',
            };

            io.to(chatRoomId).emit('newMessage', newMessage); // 클라이언트에 메시지 전송
        } catch (error) {
            console.error('메시지 저장 오류:', error);
            socket.emit('error', { success: false, message: 'Failed to save the message.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));