const express = require('express');
const app = express();
const router = express.Router();
const nunjucks = require('nunjucks');
const conn = require('../config/db');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const uploadImage = require('../config/uploadImage'); // S3 업로드 함수
const fs = require('fs');
const { log } = require('console')

// 다이어리 정보 불러오기
router.get('/list', (req, res) => {
    
})

// Nunjucks 설정
nunjucks.configure('views', {
    autoescape: true,
    express: app
});


app.get('/diaryJson', (req, res) => {
    // JSON 문자열로 변환
    const diarysJson = JSON.stringify(diarys);
    // res.render('diary.html', { diarysJson: diarysJson });
    res.json({ diarysJson: diarysJson });
});


// 다이어리 작성 기능
router.post('/submit', upload.single('image'), async (req, res) => {
    // 내용 가져오기
    console.log("Request Body:", req.body);
    const { idx, modalText, title, content } = req.body;
    let imageUrl = null;
    // 파일이 있다면 경로를 저장하고, 아니면 null
    const filePath = req.file ? req.file.path : null
    
    try {
        console.log("File Path:", filePath);
        // 파일 경로가 있다면 imageUrl에 'diary'파일의 경로가 저장될때까지 대기 
        if (filePath) {
            imageUrl = await uploadImage(filePath, 'diary');
            console.log("Image URL:", imageUrl);
        }

        // DB에 다이어리 정보와 이미지 URL 저장
        const sql = `INSERT INTO SR_DIARY (USER_IDX, DIARY_DATE, DIARY_TITLE, DIARY_CONTENT, DIARY_IMG)
                    VALUES (?, ?, ?, ?, ?)`;
        const values = [
            idx, 
            modalText[0],  // 단일 값으로 사용
            title[0],      // 단일 값으로 사용
            content[0],    // 단일 값으로 사용
            imageUrl
        ];
        
        console.log("SQL Values:", values);
        
        conn.query(sql, values, (err, result) => {
            if (err) {
                console.error('DB Insert Error: ', err);
                return res.status(500).json({ error: 'DB Insert Error' });
            }
            console.log('내용 작성 완료');
            res.redirect('/diary');
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (filePath) {
            fs.unlinkSync(filePath);
        }
    }
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



module.exports = router

//칸칸에 넣는건 풀캘린더 날짜색 변경& 여기 사블로그에 있는 방법
