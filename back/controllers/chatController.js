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

        if (chatRooms.length === 0) {
            return res.status(404).json({ success: false, message: '참여한 채팅방이 없습니다.' });
        }

        res.status(200).json({ success: true, chatRooms });
    } catch (error) {
        console.error('채팅방 리스트 가져오기 오류:', error);
        res.status(500).json({ success: false, message: '채팅방 리스트를 가져오는 데 실패했습니다.' });
    }
};

// 채팅방 메시지 가져오기
const getMessages = async (req, res) => {
    const { chatRoomId } = req.params;
    const userId = req.user.id;

    try {
        // 해당 채팅방의 메시지 가져오기
        const query = `
            SELECT messages.id, messages.sender_id, messages.content, messages.created_at
            FROM messages
            WHERE messages.chat_room_id = ?
            ORDER BY messages.created_at ASC
        `;
        const [messages] = await db.executeQuery(query, [chatRoomId]);

        if (messages.length === 0) {
            return res.status(404).json({ success: false, message: '메시지가 없습니다.' });
        }

        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('채팅방 메시지 가져오기 오류:', error);
        res.status(500).json({ success: false, message: '메시지를 가져오는 데 실패했습니다.' });
    }
};

// 채팅방 생성
const createChatRoom = async (req, res) => {
    const { name, userIds } = req.body;
    const userId = req.user.id;

    try {
        // 채팅방 생성
        const query = 'INSERT INTO chat_rooms (name) VALUES (?)';
        const [result] = await db.executeQuery(query, [name]);

        const chatRoomId = result.insertId;

        // 첫 번째 멤버로 요청자 추가
        await db.executeQuery('INSERT INTO chat_room_members (chat_room_id, user_id) VALUES (?, ?)', [chatRoomId, userId]);

        // 나머지 멤버 추가
        for (const user of userIds) {
            await db.executeQuery('INSERT INTO chat_room_members (chat_room_id, user_id) VALUES (?, ?)', [chatRoomId, user]);
        }

        res.status(201).json({ success: true, message: '채팅방이 생성되었습니다.' });
    } catch (error) {
        console.error('채팅방 생성 오류:', error);
        res.status(500).json({ success: false, message: '채팅방 생성에 실패했습니다.' });
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
    const senderId = req.user.id;

    try {
        // 메시지 저장
        const query = 'INSERT INTO messages (chat_room_id, sender_id, content) VALUES (?, ?, ?)';
        await db.executeQuery(query, [chatRoomId, senderId, content]);

        res.status(201).json({ success: true, message: '메시지가 전송되었습니다.' });
    } catch (error) {
        console.error('메시지 전송 오류:', error);
        res.status(500).json({ success: false, message: '메시지 전송에 실패했습니다.' });
    }
};

// 친구 추가
const addFriend = async (req, res) => {
    const { friendId } = req.body;
    const userId = req.user.id;

    try {
        // 친구 요청 처리 (상태는 'pending')
        const query = 'INSERT INTO friend_requests (from_user_id, to_user_id, status) VALUES (?, ?, ?)';
        await db.executeQuery(query, [userId, friendId, 'pending']);

        res.status(201).json({ success: true, message: '친구 요청이 전송되었습니다.' });
    } catch (error) {
        console.error('친구 추가 오류:', error);
        res.status(500).json({ success: false, message: '친구 추가에 실패했습니다.' });
    }
};

module.exports = {
    getChatRooms,
    getMessages,
    createChatRoom,
    addChatRoomMember,
    sendMessage,
    addFriend
};
