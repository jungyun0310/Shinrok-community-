const express = require('express')
const router = express.Router()
const conn = require('../config/db')



router.get('/list', (req, res) => {
    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const offset = (page - 1) * limit;

    // 검색 쿼리 작성
    const countSql = `SELECT COUNT(*) AS total 
                      FROM SR_BOARD B
                      JOIN SR_USER U ON B.USER_IDX = U.USER_IDX
                      WHERE B.BOARD_TITLE LIKE ? 
                      OR B.BOARD_CONTENT LIKE ? 
                      OR U.USER_NICK LIKE ?`;
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
                        COUNT(C.CMNT_CONTENT) AS COMMENT_COUNT
                    FROM 
                        SR_USER U
                        JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
                        LEFT JOIN SR_CMNT C ON B.BOARD_IDX = C.BOARD_IDX
                    WHERE 
                        B.BOARD_TITLE LIKE ?
                        OR B.BOARD_CONTENT LIKE ?
                        OR U.USER_NICK LIKE ?
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

    const searchParam = `%${searchQuery}%`;

    // 총 게시글 수 조회
    conn.query(countSql, [searchParam, searchParam, searchParam], (err, countResult) => {
        if (err) {
            console.error('DB Count Error: ', err);
            return res.status(500).json({ error: 'DB Count Error' });
        }

        const totalPosts = countResult[0].total;
        const totalPages = Math.ceil(totalPosts / limit);

        // 검색 결과 조회
        conn.query(dataSql, [searchParam, searchParam, searchParam, offset, limit], (err, dataResult) => {
            if (err) {
                console.error('DB Query Error: ', err);
                return res.status(500).json({ error: 'DB Query Error' });
            }
            console.log('dataResult', dataResult)
            res.render('boardSearch', {
                 searchResults: dataResult, 
                 currentPage: page, 
                 totalPages: totalPages, 
                 searchQuery: searchQuery });
        });
    });
});

router.get('/plant', async (req, res) => {
    console.log('req.query',req.query.q)
    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const offset = (page - 1) * limit;
    const countSql = `SELECT COUNT(*) AS total 
                      FROM SR_PLANT
                      WHERE PLANT_NAME LIKE ? `;
    const dataSql= `SELECT * 
                    FROM SR_PLANT 
                    WHERE PLANT_NAME LIKE ? 
                    LIMIT ?, ?`;

    const searchParam = `%${searchQuery}%`;
  // 총 게시글 수 조회
        conn.query(countSql, [searchParam], (err, countResult) => {
        if (err) {
        console.error('DB Count Error: ', err);
            return res.status(500).json({ error: 'DB Count Error' });
        }
        console.log('countResult',countResult)
        const totalPosts = countResult[0].total;
        const totalPages = Math.ceil(totalPosts / limit);
    conn.query(dataSql,[searchParam,offset,limit],(err,dataresult)=>{
        if (err) {
            console.error('DB Count Error: ', err);
            return res.status(500).json({ error: 'DB Count Error' });
        }
       
        res.render('dictionarySearch', {
            searchResults: dataresult,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: searchQuery,
            user: req.session.user 
        });
    })
    })
});



module.exports = router;