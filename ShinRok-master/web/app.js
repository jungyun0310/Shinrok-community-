const express = require('express');
const path = require('path');
const nunjucks = require('nunjucks');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
require('dotenv').config();
const moment = require('moment');
const momentTimezone = require('moment-timezone');
const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');

// 라우터 설정
const mainRouter = require('./routes/mainRouter');
const userRouter = require('./routes/userRouter');
const boardRouter = require('./routes/boardRouter');
const diaryRouter = require('./routes/diaryRouter');
const dictionaryRouter = require('./routes/dictionaryRouter');
const predictRouter = require('./routes/predictRouter');
const searchRouter = require('./routes/searchRouter');
const mypageRouter = require('./routes/mypageRouter');

app.use('/public', express.static('public'));
app.use('/config', express.static('config'));
app.use('/images', express.static('images'));
app.use('/assets', express.static('assets'));

// 세션 미들웨어
app.use(session({
    store: new FileStore({ 
        path: path.join(__dirname, 'sessions'),
        ttl: 86400, // 24시간 후 세션 파일 삭제 (초 단위)
        reapInterval: 3600 // 1시간마다 만료된 세션 검사 및 삭제 (초 단위)
    }),
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7200000 }, // 2시간
    rolling: true,
    touch: false,
}));

// 넌적스 세팅
app.set('view engine', 'html');
const env = nunjucks.configure('views', {
    express: app,
    watch: true
});

// 날짜 필터 추가
env.addFilter('date', (date, format) => {
  return moment(date).add(9, 'hours').format(format);
});

// 줄바꿈 필터 추가
env.addFilter('nl2br', function(str) {
    return str.replace(/\r\n|\n\r|\r|\n/g, '<br>');
});

// body-parser 미들웨어 설정(POST 허용)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/config', express.static(path.join(__dirname, 'config')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 라우터 설정
app.use('/', mainRouter);
app.use('/user', userRouter);
app.use('/board', boardRouter);
app.use('/diary', diaryRouter);
app.use('/dictionary', dictionaryRouter);
app.use('/predict', predictRouter);
app.use('/search', searchRouter);
app.use('/myPage', mypageRouter);

app.use((err, req, res, next) => {
    console.error('에러 발생:', err);
    if (err.code === 'ENOENT' && err.message.includes('sessions')) {
        console.error('세션 파일 접근 오류. 세션 디렉토리를 확인하세요.');
    }
    res.status(500).send('서버 오류가 발생했습니다.');
});

function checkSessionStore() {
    fs.readdir(path.join(__dirname, 'sessions'), (err, files) => {
        if (err) {
            console.error('세션 디렉토리 읽기 오류:', err);
        } else {
            console.log(`현재 세션 파일 수: ${files.length}`);
        }
    });
}

setInterval(checkSessionStore, 7200000); // 1시간마다 세션 저장소 확인

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});