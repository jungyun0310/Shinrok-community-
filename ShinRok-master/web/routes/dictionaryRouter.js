// routes/dictionary.js

const express = require('express');
const router = express.Router();
const conn = require('../config/db'); // 데이터베이스 연결 설정 파일

// /dictionary 엔드포인트에 대한 GET 요청 처리
router.get('/home', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 12;
    const offset = (page - 1) * itemsPerPage;

    const countSql = 'SELECT COUNT(*) as total FROM SR_PLANT';
    const sql = 'SELECT * FROM SR_PLANT LIMIT ? OFFSET ?';

    conn.query(countSql, (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).send('서버 오류');
        }

        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // 페이징 그룹 계산
        const pageGroup = Math.ceil(page / 10);
        const lastPage = pageGroup * 10;
        const firstPage = lastPage - 9;

        conn.query(sql, [itemsPerPage, offset], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('서버 오류');
            }
            
            res.render('dictionary', {
                user: req.session.user,
                specificPlant: results,
                current_page: page,
                total_pages: totalPages,
                first_page: firstPage,
                last_page: lastPage > totalPages ? totalPages : lastPage
            });
        });
    });
});


router.get('/detail', async (req, res) => {
    
    const dicId=req.query.idx
    const sql = 'SELECT * FROM SR_PLANT WHERE PLANT_IDX = ?'
    conn.query(sql,[dicId],(e,r)=>{
        const plantData=r[0]


        if (e) {
            console.error(e);
            return res.status(500).send('dictionaryRouter detail 오류');
        }
        
        res.render('dictDetail',{ 
        
            plantData:plantData,
            user: req.session.user
        })
        
    })
});

module.exports = router;