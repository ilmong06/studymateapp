const db = require('../config/db');

// 채팅방 리스트 가져오기
const getChatRooms = async (req, res) => {
    try {
        const userId = req.user.id; // JWT에서 추출된 유저 ID

        const chatRoomsQuery = `
            SELECT
                cr.id AS chatRoomId,
                cr.name AS chatRoomName,
                COALESCE(m.content, '') AS lastMessage,
                COALESCE(m.created_at, '') AS lastMessageTime,
                (
                    SELECT COUNT(*)
                    FROM messages
                    WHERE chat_room_id = cr.id AND is_read = FALSE AND sender_id != ?
                ) AS unreadCount
            FROM chat_rooms cr
                     INNER JOIN chat_room_members crm ON cr.id = crm.chat_room_id
                     LEFT JOIN messages m ON cr.id = m.chat_room_id
            WHERE crm.user_id = ?
            GROUP BY cr.id, cr.name, cr.updated_at
            ORDER BY cr.updated_at DESC;
        `;

        const chatRooms = await db.executeQuery(chatRoomsQuery, [userId, userId]);

        // 쿼리 결과 확인
        if (!chatRooms || chatRooms.length === 0) {
            return res.status(200).json({ success: true, chatRooms: [] });
        }

        res.status(200).json({
            success: true,
            chatRooms: chatRooms.map((room) => ({
                id: room.chatRoomId,
                name: room.chatRoomName,
                lastMessage: room.lastMessage || '',
                lastMessageTime: room.lastMessageTime || '',
                unreadCount: room.unreadCount || 0,
            })),
        });
    } catch (error) {
        console.error('Error fetching chat rooms:', error.message);
        res.status(500).json({ success: false, message: '채팅방 목록을 가져오는 중 오류가 발생했습니다.' });
    }
};

module.exports = {
    getChatRooms,
};
