const db = require('../config/db');

// 채팅방 리스트 가져오기
const getChatRooms = async (req, res) => {
    const userId = req.user.id;


    try {
        // 채팅방 멤버로 포함된 채팅방 리스트 가져오기
        const query = `
           SELECT chat_rooms.id, chat_rooms.name, chat_rooms.created_at
           FROM chat_rooms
           INNER JOIN chat_room_members ON chat_rooms.id = chat_room_members.chat_room_id
           WHERE chat_room_members.user_id = ?
       `;
        const chatRooms = await db.executeQuery(query, [userId]);


        res.status(200).json({ success: true, chatRooms });
    } catch (error) {
        console.error('채팅방 리스트 가져오기 오류:', error);
        res.status(500).json({ success: false, message: '채팅방 리스트를 가져오는 데 실패했습니다.' });
    }
};

// 채팅방 메시지 가져오기
const getMessages = async (req, res) => {
    const { chatRoomId } = req.params;
    console.log(chatRoomId);
    try {
        const query = `
            SELECT m.id, m.chat_room_id, m.sender_id, m.content, m.created_at, u.username
            FROM messages m
                     JOIN users u ON m.sender_id = u.id
            WHERE m.chat_room_id = ?
            ORDER BY m.created_at
        `;

        const messages = await db.executeQuery(query, [chatRoomId]);
        console.log(messages);

        // 메시지가 없을 경우 빈 배열 반환
        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('메시지 가져오기 오류:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
    }
};

// 채팅방 생성 함수
const createChatRoom = async (req, res) => {
    const { name } = req.body; // 클라이언트로부터 채팅방 이름을 받아옴
    const userId = req.user?.id; // JWT를 통해 인증된 사용자 ID

    if (!userId) {
        return res.status(401).json({ success: false, message: '사용자 인증 정보가 없습니다.' });
    }

    if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: '채팅방 이름을 입력해주세요.' });
    }

    try {
        // 사용자 존재 확인
        const userExists = await db.executeQuery('SELECT id FROM users WHERE id = ?', [userId]);
        if (userExists.length === 0) {
            return res.status(400).json({ success: false, message: '유효하지 않은 사용자입니다.' });
        }

        // 새로운 채팅방 생성
        const createChatRoomQuery = 'INSERT INTO chat_rooms (name, created_at) VALUES (?, NOW())';
        const result = await db.executeQuery(createChatRoomQuery, [name.trim()]);
        const chatRoomId = result.insertId; // 생성된 채팅방의 ID를 가져옴

        // 채팅방 멤버에 현재 사용자 추가
        const addMemberQuery = 'INSERT INTO chat_room_members (chat_room_id, user_id, joined_at) VALUES (?, ?, NOW())';
        await db.executeQuery(addMemberQuery, [chatRoomId, userId]);

        // 생성된 채팅방 정보 가져오기
        const getChatRoomQuery = 'SELECT id, name, created_at FROM chat_rooms WHERE id = ?';
        const [chatRoom] = await db.executeQuery(getChatRoomQuery, [chatRoomId]);

        // 소켓을 통해 모든 클라이언트에게 새로운 채팅방 알림
        req.app.get('io').emit('newChatRoom', chatRoom);

        // 클라이언트에게 응답
        return res.status(201).json({ success: true, chatRoom });
    } catch (error) {
        console.error('채팅방 생성 오류:', error);

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ success: false, message: '유효하지 않은 사용자 정보입니다.' });
        }

        return res.status(500).json({ success: false, message: '채팅방 생성에 실패했습니다.' });
    }
};



// 채팅방에 멤버 추가
const addChatRoomMember = async (req, res) => {
    const { chatRoomId } = req.params;
    const { userIds } = req.body;


    try {
        // 멤버 추가
        for (const userId of userIds) {
            await db.executeQuery('INSERT INTO chat_room_members (chat_room_id, user_id) VALUES (?, ?)', [chatRoomId, userId]);
        }


        res.status(200).json({ success: true, message: '멤버가 추가되었습니다.' });
    } catch (error) {
        console.error('채팅방 멤버 추가 오류:', error);
        res.status(500).json({ success: false, message: '채팅방 멤버 추가에 실패했습니다.' });
    }
};


// 메시지 보내기
const sendMessage = async (req, res) => {
    const { chatRoomId, content } = req.body;
    const senderId = req.user?.id;

    // 필수 데이터 검증
    if (!chatRoomId || !content) {
        return res.status(400).json({ success: false, message: '채팅방 ID와 메시지 내용을 입력해주세요.' });
    }

    if (!senderId) {
        return res.status(401).json({ success: false, message: '사용자 인증 정보가 없습니다.' });
    }

    try {
        // 채팅방 존재 확인
        const chatRoomExistsQuery = 'SELECT id FROM chat_rooms WHERE id = ?';
        const chatRoomExists = await db.executeQuery(chatRoomExistsQuery, [chatRoomId]);

        if (chatRoomExists.length === 0) {
            return res.status(404).json({ success: false, message: '존재하지 않는 채팅방입니다.' });
        }

        // 메시지 저장
        const query = 'INSERT INTO messages (chat_room_id, sender_id, content, created_at) VALUES (?, ?, ?, NOW())';
        const result = await db.executeQuery(query, [chatRoomId, senderId, content]);

        const newMessage = {
            id: result.insertId,
            chatRoomId,
            senderId,
            content,
            createdAt: new Date().toISOString(),
        };

        // 소켓으로 메시지 전송
        req.app.get('io').to(chatRoomId).emit('newMessage', newMessage);

        res.status(201).json({ success: true, message: '메시지가 전송되었습니다.', data: newMessage });
    } catch (error) {
        console.error('메시지 전송 오류:', error);
        res.status(500).json({ success: false, message: '메시지 전송에 실패했습니다.' });
    }
};



module.exports = {
    getChatRooms,
    getMessages,
    createChatRoom,
    addChatRoomMember,
    sendMessage,
};

