const db = require('../config/db');


// 친구 목록 가져오기
const getFriends = async (req, res) => {
    const userId = req.user.id;
    try {
        const friends = await db.executeQuery(`
           SELECT u.id, u.username
           FROM friends f
           JOIN users u ON f.friend_id = u.id
           WHERE f.user_id = ? AND f.status = 'accepted'
       `, [userId]);


        res.status(200).json({ success: true, friends });
    } catch (error) {
        console.error('Get Friends Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve friends.' });
    }
};


// 친구 검색
const searchFriend = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ success: false, message: '검색어가 제공되지 않았습니다.' });
    }

    try {
        const user = await db.executeQuery(
            'SELECT id, username FROM users WHERE username = ?',
            [query]
        );

        if (user.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({ success: true, user: user[0] });
    } catch (error) {
        console.error('Search Friend Error:', error);
        res.status(500).json({ success: false, message: 'Failed to search friend.' });
    }
};



// 친구 요청
const sendFriendRequest = async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.body;


    try {
        await db.executeQuery(
            'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
            [userId, friendId, 'pending']
        );


        res.status(200).json({ success: true, message: 'Friend request sent.' });
    } catch (error) {
        console.error('Send Friend Request Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send friend request.' });
    }
};


// 친구 삭제
const deleteFriend = async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.params;


    try {
        await db.executeQuery(
            'DELETE FROM friends WHERE user_id = ? AND friend_id = ?',
            [userId, friendId]
        );


        res.status(200).json({ success: true, message: 'Friend deleted.' });
    } catch (error) {
        console.error('Delete Friend Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete friend.' });
    }
};


module.exports = { getFriends, searchFriend, sendFriendRequest, deleteFriend };


