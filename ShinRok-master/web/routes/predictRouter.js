const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const uploadImage = require('../config/uploadImage'); // S3 업로드 함수
const fs = require('fs');
const axios = require('axios');
const { log } = require('console')

// 모델 예측
router.post('/start', upload.single('image'), async (req, res) => {
    const { idx, plant } = req.body;
    console.log(`Received predict request with body: ${JSON.stringify(req.body)}`); // 요청 데이터 로그 추가
    let imageUrl = null;
    const filePath = req.file ? req.file.path : null;

    try {
        if (filePath) {
            imageUrl = await uploadImage(filePath, 'predict');
        }
        const sql = `INSERT INTO SR_DSS (USER_IDX, DSS_PLANT, DSS_IMG)
                    VALUES (?, ?, ?)`;
        const values = [idx, plant, imageUrl];
        conn.query(sql, values, async (e, r) => {
            if (e) {
                console.log("에러 : ", e);
                return res.status(500).json({ e: 'DB에러' });
            }
            console.log('예측 요청 처리');

            // Flask 서버로 예측 요청을 보냄
            try {
                const predictResponse = await axios.post('http://localhost:5000/predict', {
                    language: 'Korean',
                    idx: idx
                });

                console.log(`Predict server response: ${JSON.stringify(predictResponse.data)}`); // 응답 데이터 로그 추가

                if (predictResponse.status === 200) {
                    // 예측이 완료되면 클라이언트를 리다이렉트
                    return res.redirect('http://localhost:3000/predict/result');
                } else {
                    return res.status(500).json({ error: 'Failed to start prediction' });
                }
            } catch (error) {
                console.error('예측 서버 연결 실패:', error.message);
                return res.status(500).json({ error: 'Failed to connect to prediction server' });
            }
        });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    } finally {
        if (filePath) {
            fs.unlinkSync(filePath);
        }
    }
})

// 결과창
router.get('/result', (req, res) => {
    const idx = req.session.user.idx
    // log(idx)
    const sql = `SELECT * FROM SR_DSS 
                WHERE USER_IDX = ? ORDER BY DSS_DATE DESC LIMIT 1`

    conn.query(sql, [idx], (e, r) => {
        if(e) {
            console.error('DB 에러', e)
            return res.status(500).json({error : 'DB쿼리 에러'})
        } else {
            log(r)
            res.render('result', {res : r, user: req.session.user})
        }
    })            

})


module.exports = router;
