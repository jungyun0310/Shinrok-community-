const express = require('express')
const router = express.Router()
const conn = require('../config/db')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const uploadImage = require('../config/uploadImage') // S3 업로드 함수
const fs = require('fs')
const { log } = require('console')

// 게시판 관련 기능


// 게시글 작성 기능
router.post('/upload', upload.single('image'), async (req, res) => {
    const { title, content, category, idx } = req.body
    let imageUrl = null
    const filePath = req.file ? req.file.path : null

    try {
        if (filePath) {
            imageUrl = await uploadImage(filePath, 'board'); // 폴더명을 'board'로 지정
        }

        // 데이터베이스에 게시물 정보와 이미지 URL 저장
        const sql = `INSERT INTO SR_BOARD (USER_IDX, BOARD_TITLE, BOARD_CONTENT, BOARD_CATE, BOARD_IMG) 
                    VALUES (?, ?, ?, ?, ?)`
        const values = [idx, title, content, category, imageUrl]
        conn.query(sql, values, (err, result) => {
            if (err) {
                console.error('DB Insert Error: ', err);
                return res.status(500).json({ error: 'DB Insert Error' })
            }
            console.log('게시글 작성 완료')
            // 새로 작성된 게시글의 ID를 사용하여 해당 게시글 페이지로 리다이렉트
            res.redirect(`/board/detailPost?idx=${result.insertId}`)
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    } finally {
        // 임시 파일 삭제
        if (filePath) {
            fs.unlinkSync(filePath)
        }
    }
})


// 메인페이지에 자유게시판을 불러옴
router.get('/freePost', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지 번호 (기본값: 1)
    const limit = 15; // 페이지 당 게시글 수
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM SR_BOARD WHERE BOARD_CATE = '자유'`;
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
                        COUNT(C.CMNT_CONTENT) AS COMMENT_COUNT,
                        B.BOARD_RECOMMEND
                    FROM 
                        SR_USER U
                        JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
                        LEFT JOIN SR_CMNT C ON B.BOARD_IDX = C.BOARD_IDX
                    WHERE 
                        B.BOARD_CATE = '자유'
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
            res.render('freePost', { boardFree: dataResult, currentPage: page, totalPages: totalPages, user: req.session.user });
        });
    });
});

// 메인페이지에 자랑게시판을 불러옴

router.get('/bragPost', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지 번호 (기본값: 1)
    const limit = 12; // 페이지 당 게시글 수
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM SR_BOARD WHERE BOARD_CATE = '자랑'`;
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
                        B.BOARD_CATE = '자랑'
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
            res.render('bragPost', { bragPost: dataResult, currentPage: page, totalPages: totalPages, user: req.session.user });
        });
    });
});



// 세부 목록페이지 (+그림포함, 사이드바 통해서)
router.get('/bragList', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지 번호 (기본값: 1)
    const limit = 15; // 페이지 당 게시글 수
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM SR_BOARD WHERE BOARD_CATE = '자랑'`;
    const sql = `SELECT 
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
                B.BOARD_CATE = '자랑'
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
            ORDER BY B.BOARD_DATE DESC`

    conn.query(countSql, (err, countResult) => {
        if (err) {
            console.error('DB Count Error: ', err);
            return res.status(500).json({ error: 'DB Count Error' });
        }

        const totalPosts = countResult[0].total;
        const totalPages = Math.ceil(totalPosts / limit);

        conn.query(sql, [offset, limit], (err, dataResult) => {
            if (err) {
                console.error('DB Query Error: ', err);
                return res.status(500).json({ error: 'DB Query Error' });
            }

            console.log(dataResult);
            res.render('bragList', { bragList: dataResult, currentPage: page, totalPages: totalPages, user: req.session.user })
        })
    })
})

// router.get('/bragdetailPost', (req, res) => {
//     const postId = req.query.idx

//     // 세션에 조회한 게시글 ID 저장
//     if (!req.session.viewedPosts) {
//         req.session.viewedPosts = {}
//     }

//     if (!req.session.viewedPosts[postId]) {
//         req.session.viewedPosts[postId] = true;

//         const updateCountSql = `UPDATE SR_BOARD SET BOARD_COUNT = BOARD_COUNT + 1 WHERE BOARD_IDX = ?`

//         conn.query(updateCountSql, [postId], (err, result) => {
//             if (err) {
//                 console.error('DB Update Error: ', err)
//                 return res.status(500).json({ error: 'DB Update Error' })
//             }

//             bragPost(postId, req, res)
//         })
//     } else {
//         bragPost(postId, req, res)
//     }
// });

// function bragPost(postId, req, res) {
//     const postSql = `SELECT 
//                         U.USER_IDX,
//                         U.USER_NICK,
//                         U.USER_PICTURE,
//                         B.BOARD_IDX,
//                         B.BOARD_TITLE,
//                         B.BOARD_CONTENT,
//                         B.BOARD_COUNT,
//                         B.BOARD_DATE,
//                         B.BOARD_IMG,
//                         B.BOARD_CATE
//                     FROM 
//                         SR_USER U
//                         JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
//                     WHERE 
//                         B.BOARD_IDX = ?`

//     conn.query(postSql, [postId], (err, postResult) => {
//         if (err) {
//             console.error('DB Query Error: ', err)
//             return res.status(500).json({ error: 'DB Query Error' })
//         }
//         if (postResult.length === 0) {
//             return res.status(404).json({ error: 'Post not found' })
//         }

//         const post = postResult[0]
//         res.render('bragdetailPost', { bragdetailPost: post, user: req.session.user })
//     })
// }

// 질문 게시판
router.get('/quesPost', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지 번호 (기본값: 1)
    const limit = 15; // 페이지 당 게시글 수
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM SR_BOARD WHERE BOARD_CATE = '질문'`;
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
                        COUNT(C.CMNT_CONTENT) AS COMMENT_COUNT,
                        B.BOARD_RECOMMEND
                    FROM 
                        SR_USER U
                        JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
                        LEFT JOIN SR_CMNT C ON B.BOARD_IDX = C.BOARD_IDX
                    WHERE 
                        B.BOARD_CATE = '질문'
                    GROUP BY 
                        B.BOARD_IDX, 
                        U.USER_IDX, 
                        U.USER_NICK, 
                        U.USER_PICTURE, 
                        B.BOARD_TITLE, 
                        B.BOARD_CONTENT, 
                        B.BOARD_COUNT, 
                        B.BOARD_DATE, 
                        B.BOARD_IMG,
                        B.BOARD_RECOMMEND
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
            res.render('quesPost', { quesPost: dataResult, currentPage: page, totalPages: totalPages, user: req.session.user });
        });
    });
});

router.get('/quesList', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지 번호 (기본값: 1)
    const limit = 15; // 페이지 당 게시글 수
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM SR_BOARD WHERE BOARD_CATE = '질문'`;
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
                    COUNT(DISTINCT C.CMNT_IDX) AS COMMENT_COUNT,
                    B.BOARD_RECOMMEND
                FROM 
                    SR_USER U
                    JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
                    LEFT JOIN SR_CMNT C ON B.BOARD_IDX = C.BOARD_IDX
                WHERE 
                    B.BOARD_CATE = '질문'
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
            
            res.render('quesPost', { 
                quesPost: dataResult, 
                currentPage: page, 
                totalPages: totalPages, 
                user: req.session.user 
            });
        });
    })
})

router.get('/question', (req, res) => {
    console.log('쿼리', req.query)
    
    
    const postId = req.query.idx

    // 세션에 조회한 게시글 ID 저장
    if (!req.session.viewedPosts) {
        req.session.viewedPosts = {}
    }

    if (!req.session.viewedPosts[postId]) {
        req.session.viewedPosts[postId] = true;

        const updateCountSql = `UPDATE SR_BOARD SET BOARD_COUNT = BOARD_COUNT + 1 WHERE BOARD_IDX = ?`

        conn.query(updateCountSql, [postId], (err, result) => {
            if (err) {
                console.error('DB Update Error: ', err)
                return res.status(500).json({ error: 'DB Update Error' })
            }

            quest(postId, req, res)
        })
    } else {
        quest(postId, req, res)
    }
});

function quest(postId, req, res) {
    const postSql = `SELECT 
                        U.USER_IDX,
                        U.USER_NICK,
                        U.USER_PICTURE,
                        B.BOARD_IDX,
                        B.BOARD_TITLE,
                        B.BOARD_CONTENT,
                        B.BOARD_COUNT,
                        B.BOARD_DATE,
                        B.BOARD_IMG,
                        B.BOARD_CATE
                    FROM 
                        SR_USER U
                        JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
                    WHERE 
                        B.BOARD_IDX = ?`

                        const answerSql = `
                        SELECT 
                            A.*,
                            U.USER_PICTURE,
                            U.USER_NICK
                        FROM 
                            SR_ANSWER A
                        JOIN 
                            SR_USER U ON A.USER_IDX = U.USER_IDX
                        WHERE 
                            A.BOARD_IDX = ?
                    `;

    conn.query(postSql, [postId], (err, postResult) => {
        if (err) {
            console.error('DB Query Error: ', err)
            return res.status(500).json({ error: 'DB Query Error' })
        }
        if (postResult.length === 0) {
            return res.status(404).json({ error: 'Post not found' })
        }
        
        const post = postResult

        // 답변목록
        conn.query(answerSql, [postId], (err, r) => {
            if (err) {
                console.error('DB Query Error: ', err)
                return res.status(500).json({ error: 'DB Query Error' })
            }
            
            
            res.render('question', { question: postResult[0], answer: r, user: req.session.user })
        })
    })

}




router.get('/answerUpload', async (req, res) => {
    const { content, board_idx, user_idx } = req.query
    let imageUrl = null
    
    console.log('쿼리', req.query)
    try {
        // 데이터베이스에 답변 정보 저장
        const sql = `INSERT INTO SR_ANSWER (ANSWER_CONTENT, BOARD_IDX, USER_IDX) 
                    VALUES (?, ?, ?)`
                    const values = [content, board_idx, user_idx]
                    
        conn.query(sql, values, (err, result) => {
            if (err) {
                console.error('DB Insert Error: ', err);
                return res.status(500).json({ error: 'DB Insert Error or 세션 오류' })
            }
            console.log('답변 작성 완료')
            res.redirect(`/board/question?idx=${board_idx}`)
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})



//질문답변 페이지화인가?
router.get('/quesTans', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지 번호 (기본값: 1)
    const limit = 15; // 페이지 당 게시글 수
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM SR_BOARD WHERE BOARD_CATE = '답변'`;
    const sql = `SELECT 
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
                    B.BOARD_CATE = '답변'
                GROUP BY 
                    B.BOARD_IDX, 
                    U.USER_IDX, 
                    U.USER_NICK, 
                    U.USER_PICTURE, 
                    B.BOARD_TITLE, 
                    B.BOARD_CONTENT, 
                    B.BOARD_COUNT, 
                    B.BOARD_DATE, 
                    B.BOARD_IMG`

    conn.query(countSql, (err, countResult) => {
        if (err) {
            console.error('DB Count Error: ', err);
            return res.status(500).json({ error: 'DB Count Error' });
        }

        const totalPosts = countResult[0].total;
        const totalPages = Math.ceil(totalPosts / limit);

        conn.query(sql, [offset, limit], (err, dataResult) => {
            if (err) {
                console.error('DB Query Error: ', err);
                return res.status(500).json({ error: 'DB Query Error' });
            }
            res.render('quesTans', { quesTans: dataResult, currentPage: page, totalPages: totalPages })
        })
    })
})


// 게시글 상세보기 페이지
router.get('/detailPost', (req, res) => {
    const postId = req.query.idx

    // 세션에 조회한 게시글 ID 저장
    if (!req.session.viewedPosts) {
        req.session.viewedPosts = {}
    }

    if (!req.session.viewedPosts[postId]) {
        req.session.viewedPosts[postId] = true;

        const updateCountSql = `UPDATE SR_BOARD SET BOARD_COUNT = BOARD_COUNT + 1 WHERE BOARD_IDX = ?`

        conn.query(updateCountSql, [postId], (err, result) => {
            if (err) {
                console.error('DB Update Error: ', err)
                return res.status(500).json({ error: 'DB Update Error' })
            }

            getPost(postId, req, res)
        })
    } else {
        getPost(postId, req, res)
    }
});

function getPost(postId, req, res) {
    const postSql = `SELECT 
                        U.USER_IDX,
                        U.USER_NICK,
                        U.USER_PICTURE,
                        B.BOARD_IDX,
                        B.BOARD_TITLE,
                        B.BOARD_CONTENT,
                        B.BOARD_COUNT,
                        B.BOARD_DATE,
                        B.BOARD_IMG,
                        B.BOARD_CATE
                    FROM 
                        SR_USER U
                        JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
                    WHERE 
                        B.BOARD_IDX = ?`

    conn.query(postSql, [postId], (err, postResult) => {
        if (err) {
            console.error('DB Query Error: ', err)
            return res.status(500).json({ error: 'DB Query Error' })
        }
        if (postResult.length === 0) {
            return res.status(404).json({ error: 'Post not found' })
        }
        const post = postResult[0]
        // log(post)
        res.render('detailPost', { post: post, user: req.session.user })
    })
}


// 댓글 목록 조회
router.get('/comments', (req, res) => {
    const { board_idx } = req.query;
    console.log(req.session.user);

    // 댓글 목록 조회
    const commentsSql = `SELECT 
                            C.CMNT_IDX,
                            C.CMNT_CONTENT,
                            C.CMNT_DATE,
                            U.USER_NICK,
                            U.USER_PICTURE
                        FROM 
                            SR_CMNT C
                            JOIN SR_USER U ON C.USER_IDX = U.USER_IDX
                        WHERE 
                            C.BOARD_IDX = ?
                        ORDER BY C.CMNT_DATE ASC`;

    // 댓글 수 조회 
    const countSql = `SELECT COUNT(*) AS COMMENT_COUNT FROM SR_CMNT WHERE BOARD_IDX = ?`;

    // 댓글 목록 조회
    conn.query(commentsSql, [board_idx], (err, commentsResult) => {
        if (err) {
            console.error('DB Query Error: ', err);
            return res.status(500).json({ error: 'DB Query Error' });
        }

        // 댓글 수 조회
        conn.query(countSql, [board_idx], (countErr, countResult) => {
            if (countErr) {
                console.error('Count Query Error: ', countErr);
                return res.status(500).json({ error: 'Count Query Error' });
            }

            res.json({ success: true, comments: commentsResult, commentCount: countResult[0].COMMENT_COUNT, user: req.session.user });
        });
    });
});


// 댓글기능
router.post('/cmnt', (req, res) => {
    let { user_idx, board_idx, content } = req.body
    console.log(req.body)
    if (!user_idx || !board_idx || !content) {
        return res.json({ success: false, message: '댓글을 작성 해주세요.' })
    }

    const sql = `INSERT INTO SR_CMNT (BOARD_IDX, USER_IDX, CMNT_CONTENT) VALUES (?, ?, ?)`

    conn.query(sql, [board_idx, user_idx, content], (err, rows) => {
        if (err) {
            console.error('Insert Error: ', err)
            return res.json({ success: false, message: '댓글 삽입에 실패했습니다.' })
        }


        if (err) {
            res.send(`<script>alert('댓글 삽입에 실패했습니다.'); </script>`)
        }

        // 삽입 성공
        res.json({ success: true, message: '댓글이 성공적으로 등록되었습니다.', board_idx: board_idx })

    })
})


// 수정 페이지로 이동
router.get('/changePost', (req, res) => {
    const board_idx = req.query.board_idx
    // console.log(board_idx)
    const sql = `SELECT * FROM SR_BOARD WHERE BOARD_IDX = ?`

    conn.query(sql, [board_idx], (e, r) => {
        if (e) {
            console.log('DB에러 : ' + e)
            return res.status(500).json({ error: 'DB 쿼리에러' })
        } else if (r.length === 0) {
            return res.status(404).json({ errer: "페이지 없음" })
        } else {
            const post = r[0]
            // console.log(r)
            res.render('changePost', { post: post, user: req.session.user })
        }
    })
})

// 게시글 수정 기능
router.post('/change', (req, res) => {
    const { title, category, content, board_idx } = req.body
    // log(req.body)
    const sql = `UPDATE SR_BOARD SET BOARD_CONTENT = ? WHERE BOARD_IDX = ? `

    conn.query(sql, [content, board_idx], (e, r) => {
        if (e) {
            // log(e)
            return res.status(500).json({ error: "DB쿼리에러" })
        } else if (r.length === 0) {
            return res.status(404).json({ errer: "페이지 없음" })
        } else {
            const post = r[0]
            // console.log(r)
            res.json({ success: true, message: '게시글이 성공적으로 수정되었습니다.', board_idx: board_idx })
        }
    })
})

// 자유게시판의 전체 목록을 가져옴
router.get('/freeList', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지 번호 (기본값: 1)
    const limit = 15; // 페이지 당 게시글 수
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM SR_BOARD WHERE BOARD_CATE = '자유'`;
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
                        COUNT(C.CMNT_CONTENT) AS COMMENT_COUNT,
                        B.BOARD_RECOMMEND
                    FROM 
                        SR_USER U
                        JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
                        LEFT JOIN SR_CMNT C ON B.BOARD_IDX = C.BOARD_IDX
                    WHERE 
                        B.BOARD_CATE = '자유'
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
            res.render('freeList', { boardFree: dataResult, currentPage: page, totalPages: totalPages, user: req.session.user });
        });
    });
});

router.get('/delete', (req, res) => {
    const board_idx = req.query.idx;
    const deleteRecommendationsSql = `DELETE FROM SR_RECOMMEND WHERE BOARD_IDX = ?`;
    const deleteBoardSql = `DELETE FROM SR_BOARD WHERE BOARD_IDX = ?`;

    conn.beginTransaction((err) => {
        if (err) {
            log(err);
            return res.status(500).json({ error: "트랜잭션 시작 오류" });
        }

        conn.query(deleteRecommendationsSql, [board_idx], (err, results) => {
            if (err) {
                log(err);
                return conn.rollback(() => {
                    res.status(500).json({ error: "추천 데이터 삭제 오류" });
                });
            }

            conn.query(deleteBoardSql, [board_idx], (err, results) => {
                if (err) {
                    log(err);
                    return conn.rollback(() => {
                        res.status(500).json({ error: "게시글 삭제 오류" });
                    });
                }

                conn.commit((err) => {
                    if (err) {
                        log(err);
                        return conn.rollback(() => {
                            res.status(500).json({ error: "트랜잭션 커밋 오류" });
                        });
                    }

                    res.json({ success: true, message: '게시글이 성공적으로 삭제되었습니다.', board_idx: board_idx });
                });
            });
        });
    });
});




function getPost(postId, req, res) {
    const postSql = `SELECT 
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
                        B.BOARD_RECOMMEND
                    FROM 
                        SR_USER U
                        JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
                    WHERE 
                        B.BOARD_IDX = ?`

    conn.query(postSql, [postId], (err, postResult) => {
        if (err) {
            console.error('DB Query Error: ', err)
            return res.status(500).json({ error: 'DB Query Error' })
        }
        if (postResult.length === 0) {
            return res.status(404).json({ error: 'Post not found' })
        }
        const post = postResult[0]
        res.render('detailPost', { post: post, user: req.session.user })
    })
}


router.get('/hotPost', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지 번호 (기본값: 1)
    const limit = 15; // 페이지 당 게시글 수
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM SR_BOARD WHERE BOARD_RECOMMEND >= 3;`
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
                        COUNT(C.CMNT_IDX) AS COMMENT_COUNT
                    FROM 
                        SR_BOARD B
                        JOIN SR_USER U ON B.USER_IDX = U.USER_IDX
                        LEFT JOIN SR_CMNT C ON B.BOARD_IDX = C.BOARD_IDX
                    WHERE 
                        B.BOARD_RECOMMEND >= 3
                    GROUP BY
                        B.BOARD_IDX, U.USER_IDX, U.USER_NICK, U.USER_PICTURE,
                        B.BOARD_TITLE, B.BOARD_CONTENT, B.BOARD_COUNT,
                        B.BOARD_DATE, B.BOARD_IMG, B.BOARD_CATE
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
            res.render('recommend', { data: dataResult, currentPage: page, totalPages: totalPages, user: req.session.user });
        });
    });
});

// 자유게시판의 전체 목록을 가져옴
router.get('/hot', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지 번호 (기본값: 1)
    const limit = 15; // 페이지 당 게시글 수
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS total FROM SR_BOARD WHERE BOARD_RECOMMEND >= 3;`
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
                        COUNT(C.CMNT_IDX) AS COMMENT_COUNT
                    FROM 
                        SR_BOARD B
                        JOIN SR_USER U ON B.USER_IDX = U.USER_IDX
                        LEFT JOIN SR_CMNT C ON B.BOARD_IDX = C.BOARD_IDX
                    WHERE 
                        B.BOARD_RECOMMEND >= 3
                    GROUP BY
                        B.BOARD_IDX, U.USER_IDX, U.USER_NICK, U.USER_PICTURE,
                        B.BOARD_TITLE, B.BOARD_CONTENT, B.BOARD_COUNT,
                        B.BOARD_DATE, B.BOARD_IMG, B.BOARD_CATE
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
            res.render('freeList', { boardFree: dataResult, currentPage: page, totalPages: totalPages,user: req.session.user });
        });
    });
});

router.post('/recommend', async (req, res) => {
    const { idx: board_idx } = req.body;
    const user_idx = req.session.user.idx;
            
    try {
          // 게시글 작성자 확인
          const [postResult] = await conn.promise().query(
            'SELECT USER_IDX FROM SR_BOARD WHERE BOARD_IDX = ?',
            [board_idx]
        );
        
        if (postResult.length === 0) {
            return res.json({ success: false, message: "게시글을 찾을 수 없습니다." });
        }

        if (postResult[0].USER_IDX == user_idx) {
            return res.json({ success: false, message: "자신의 게시글은 추천할 수 없습니다." });
        }
        // 이미 추천했는지 확인
        const [checkResult] = await conn.promise().query(
            'SELECT * FROM SR_RECOMMEND WHERE USER_IDX = ? AND BOARD_IDX = ?',
            [user_idx, board_idx]
        );

        if (checkResult.length > 0) {
            return res.json({ success: false, message: "이미 추천한 게시글입니다." });
        }

        await conn.promise().beginTransaction();

        // 추천 수 증가
        await conn.promise().query(
            'UPDATE SR_BOARD SET BOARD_RECOMMEND = BOARD_RECOMMEND + 1 WHERE BOARD_IDX = ?',
            [board_idx]
        );

        // 추천 기록 저장
        await conn.promise().query(
            'INSERT INTO SR_RECOMMEND (USER_IDX, BOARD_IDX) VALUES (?, ?)',
            [user_idx, board_idx]
        );

        // 최신 추천 수 조회
        const [recommendResult] = await conn.promise().query(
            'SELECT board_recommend FROM SR_BOARD WHERE board_idx = ?',
            [board_idx]
        );

        await conn.promise().commit();

        res.json({
            success: true,
            message: '추천이 완료되었습니다.',
            recommendCount: recommendResult[0].board_recommend
        });
    } catch (error) {
        await conn.promise().rollback();
        console.error('추천 처리 중 오류 발생:', error);
        res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
});

function getPost(postId, req, res) {
    const postSql = `SELECT 
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
                        B.BOARD_RECOMMEND
                    FROM 
                        SR_USER U
                        JOIN SR_BOARD B ON U.USER_IDX = B.USER_IDX
                    WHERE 
                        B.BOARD_IDX = ?`

    conn.query(postSql, [postId], (err, postResult) => {
        if (err) {
            console.error('DB Query Error: ', err)
            return res.status(500).json({ error: 'DB Query Error' })
        }
        if (postResult.length === 0) {
            return res.status(404).json({ error: 'Post not found' })
        }
        const post = postResult[0]
        res.render('detailPost', { post: post, user: req.session.user })
    })
}


module.exports = router;


