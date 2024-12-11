const db = require('../config/db');

// 게시글 목록 조회
const getPosts = async (req, res) => {
    try {
        const query = 'SELECT postNum, title, content, created_at, username FROM posts';
        const posts = await db.executeQuery(query, []);
        res.status(200).json({ success: true, posts });
    } catch (error) {
        console.error('게시글 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '게시글 목록을 가져오는 데 실패했습니다.' });
    }
};

// 게시글 생성
const createPost = async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ success: false, message: '제목, 내용은 필수 항목입니다.' });
    }

    try {
        const query = 'INSERT INTO posts (title, content, username) VALUES (?, ?, ?)';
        await db.executeQuery(query, [title, content, req.user.username]);
        res.status(201).json({ success: true, message: '게시글이 성공적으로 생성되었습니다.' });
    } catch (error) {
        console.error('게시글 생성 오류:', error);
        res.status(500).json({ success: false, message: '게시글 생성에 실패했습니다.' });
    }
};

// 게시글 상세 조회
const getPostDetails = async (req, res) => {
    const { postNum } = req.params;
    console.log(postNum);

    try {
        const query = 'SELECT * FROM posts WHERE postNum = ?';
        const [post] = await db.executeQuery(query, [postNum]);

        if (!post) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        res.status(200).json({ success: true, post });
    } catch (error) {
        console.error('게시글 상세 조회 오류:', error);
        res.status(500).json({ success: false, message: '게시글 정보를 가져오는 데 실패했습니다.' });
    }
};

// 댓글 목록 조회
const getComments = async (req, res) => {
    const { postNum } = req.params;
    console.log("postNum for comments:", postNum);

    try {
        const query = `
            SELECT c.id, c.content, DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') AS created_at, u.username
            FROM comments c
                     JOIN users u ON c.author_id = u.id
            WHERE c.postNum = ?
        `;
        const comments = await db.executeQuery(query, [postNum]);
        res.status(200).json({ success: true, comments });
    } catch (error) {
        console.error('댓글 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '댓글 목록을 가져오는 데 실패했습니다.' });
    }
};


// 댓글 추가
const addComment = async (req, res) => {
    const { postNum } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ success: false, message: '댓글 내용은 필수 항목입니다.' });
    }

    try {
        // 댓글 삽입
        const query = 'INSERT INTO comments (postNum, author_id, content) VALUES (?, ?, ?)';
        const result = await db.executeQuery(query, [postNum, req.user.id, content]);

        // 삽입된 댓글 정보 조회
        const insertedCommentQuery = `
            SELECT c.id, c.content, c.created_at, u.username 
            FROM comments c
            JOIN users u ON c.author_id = u.id
            WHERE c.id = ?
        `;
        const [newComment] = await db.executeQuery(insertedCommentQuery, [result.insertId]);

        res.status(201).json({ success: true, comment: newComment });
    } catch (error) {
        console.error('댓글 추가 오류:', error);
        res.status(500).json({ success: false, message: '댓글 추가에 실패했습니다.' });
    }
};


module.exports = { getPosts, createPost, getPostDetails, getComments, addComment };
