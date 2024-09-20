const { log } = require('console')
const express = require('express')
const router = express.Router()
const conn = require('../config/db')
const path = require('path')
const file_Path = path.join(__dirname, "") 

// 페이지 이동 관련 기능

// 메인
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지 번호 (기본값: 1)
    const limit = 15; // 페이지 당 게시글 수
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM SR_BOARD`;
    const dataSql = `SELECT 
                        U.USER_IDX,
                        U.USER_NICK,
                        U.USER_PICTURE,
                        B.BOARD_IDX,
                        B.BOARD_TITLE,
                        B.BOARD_CONTENT,
                        B.BOARD_COUNT,
                        B.BOARD_DATE,
                        B.BOARD_IMG,
                        B.BOARD_CATE,
                        B.BOARD_RECOMMEND,
                        COUNT(C.CMNT_CONTENT) AS COMMENT_COUNT
                    FROM 
                        SR_USER U
                        JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
                        LEFT JOIN SR_CMNT C ON B.BOARD_IDX = C.BOARD_IDX
                    WHERE 
                        BOARD_CATE != '답변'
                    GROUP BY 
                        B.BOARD_IDX, 
                        U.USER_IDX, 
                        U.USER_NICK, 
                        U.USER_PICTURE, 
                        B.BOARD_TITLE, 
                        B.BOARD_CONTENT, 
                        B.BOARD_COUNT, 
                        B.BOARD_DATE, 
                        B.BOARD_IMG
                        
                    ORDER BY B.BOARD_DATE DESC
                    LIMIT ?, ?`;

    conn.query(countSql, (err, countResult) => {
        if (err) {
            console.error('DB Count Error: ', err);
            return res.status(500).json({ error: 'DB Count Error' });
        }

        const totalPosts = countResult[0].total;
        const totalPages = Math.ceil(totalPosts / limit);

        conn.query(dataSql, [offset, limit], (err, dataResult) => {
            if (err) {
                console.error('DB Query Error: ', err);
                return res.status(500).json({ error: 'DB Query Error' });
            }

            if (req.session) {
                console.log(req.session.user);
                res.render('main', { user: req.session.user, boardlist: dataResult, page: page, totalpage: totalPages });
            } else {
                res.render('main', { boardlist: dataResult, page: page, totalpage: totalPages });
            }
        });
    });
});


// 글쓰기 페이지 이동
router.get('/plusPost', (req, res) => {
    res.render('plusPost',  { user: req.session.user })
})

// 자유게시판 List로 이동
router.get('/freeList', (req, res)=>{
    res.render('freeList', {user: req.session.user})
})

// 자랑게시판 List로 이동
router.get('/bragList', (req, res)=>{
    res.render('bragList', {user: req.session.user})
})

// 질문게시판 List로 이동
router.get('/quesList', (req, res)=>{
    res.render('quesList', {user: req.session.user})
})

// 다이어리 페이지 이동
router.get('/diary', (req, res) => {
    const user_idx = req.session.user.idx;
    console.log(user_idx); // 디버깅 로그

    const sql = `SELECT * FROM SR_DIARY WHERE USER_IDX = ?`;
    const imgsql = `SELECT * FROM SR_DIARY_ICON WHERE USER_IDX = ?`;

    conn.query(sql, [user_idx], (e, diaryResult) => {
        if (e) {
            console.error('DB Query Error: ', e);
            return res.status(500).json({ error: 'DB Query Error' });
        }

        conn.query(imgsql, [user_idx], (e, imgResult) => {
            if (e) {
                console.error('DB Query Error: ', e);
                return res.status(500).json({ error: 'DB Query Error' });
            }
            log(diaryResult)
            log(imgResult)
            res.render('diary', {
                user: req.session.user,
                diarys: diaryResult,
                icons: imgResult
            });
        });
    });
});

//다이어리 JSON 데이터 응답
router.get('/diaryJSON', (req, res) => {
    const user_idx = req.session.user.idx;
    console.log(user_idx); // 디버깅 로그

    const sql = `SELECT * FROM SR_DIARY WHERE USER_IDX = ?`;
    const imgsql = `SELECT * FROM SR_DIARY_ICON WHERE USER_IDX = ?`;

    conn.query(sql, [user_idx], (e, diaryResult) => {
        if (e) {
            console.error('DB Query Error: ', e);
            return res.status(500).json({ error: 'DB Query Error' });
        }

        conn.query(imgsql, [user_idx], (e, imgResult) => {
            if (e) {
                console.error('DB Query Error: ', e);
                return res.status(500).json({ error: 'DB Query Error' });
            }
            log(diaryResult)
            log(imgResult)
            res.json({
                
                diarys: diaryResult
            
            });
        });
    });
});


// 사전 페이지 이동
router.get('/dictionary', (req, res)=>{
    res.render('dictionary', {user: req.session.user})
})

// 사전 세부 페이지로 이동
router.get('/dictDetail', (req, res)=>{
    res.render('dictDetail', {user: req.session.user})
})

// 병충해 진단 페이지
router.get('/predict', (req, res) => {
    res.render('predict', {user: req.session.user})
})

// 마이페이지 이동
router.post('/myPage', (req,res)=>{
    res.render('myPage', {user: req.session.user})
})

router.get('/search', (req,res)=>{
    res.render('search', {user: req.session.user})
})
 
// 답변 이동
router.get('/answer', (req,res)=>{
    res.render('answer', {user: req.session.user})
})

module.exports = router
