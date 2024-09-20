require('dotenv').config({ path: '.env' });
const express = require('express');
const router = express.Router();
const axios = require('axios');
const querystring = require('querystring');
const KAKAO_APP_KEY = process.env.KAKAO_APP_KEY;
const REDIRECT_URI = process.env.REDIRECT_URI;

// 카카오 로그인 페이지로 이동
router.get('/login', (req, res) => {
  // const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_APP_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`; // 자동로그인
  // const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_APP_KEY}&redirect_uri=${REDIRECT_URI}&prompt=login`;  //무조건 재로그인 
  const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_APP_KEY}&redirect_uri=${REDIRECT_URI}&prompt=select_account`; // 재로그인 선택
  res.redirect(kakaoAuthURL);
});

// 카카오 OAuth 콜백 처리
router.get('/oauth', async (req, res, next) => {
  const code = req.query.code;
  try {
    // 액세스 토큰 요청
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        client_id: KAKAO_APP_KEY,
        redirect_uri: REDIRECT_URI,
        code: code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    const accessToken = tokenResponse.data.access_token;

    // 사용자 정보 요청
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const kakaoId = userResponse.data.id;
    const nickname = userResponse.data.properties.nickname;
    const profileImage = userResponse.data.properties.profile_image;

    // 데이터베이스 쿼리
    const db = require('../config/db');

    // 사용자 정보가 데이터베이스에 존재하는지 확인
    const selectUserQuery = `
      SELECT USER_IDX, USER_STATUS, USER_CATE, USER_NICK
      FROM SR_USER
      WHERE AUTH_ID = ?
    `;
    db.query(selectUserQuery, [kakaoId], (err, userResults) => {
      if (err) {
        console.error('Error fetching user from database:', err);
        return next(err);
      }

      if (userResults.length > 0) {
        // 사용자가 이미 데이터베이스에 존재하는 경우, 세션에 사용자 정보 저장
        const user = userResults[0];
        req.session.user = {
          idx: user.USER_IDX,
          status: user.USER_STATUS,
          category: user.USER_CATE,
          nick:user.USER_NICK
        };
        req.session.accessToken = accessToken; // Access Token 저장
        res.redirect('/'); // 메인 페이지로 이동
      } else {
        // 사용자가 데이터베이스에 존재하지 않는 경우, 사용자 정보 삽입
        const insertUserQuery = `
          INSERT INTO SR_USER (USER_NICK, USER_NAME, AUTH_ID, SNS_PROVIDER, USER_PICTURE)
          VALUES (?, ?, ?, 'kakao', ?)
        `;
        db.query(insertUserQuery, [nickname, nickname, kakaoId, profileImage], (error, results) => {
          if (error) {
            console.error('Error inserting user into database:', error);
            return next(error);
          }

          // 사용자 추가 정보를 DB에서 가져오기
          db.query(selectUserQuery, [kakaoId], (err, userResults) => {
            if (err) {
              console.error('Error fetching user from database after insertion:', err);
              return next(err);
            }

            if (userResults.length > 0) {
              const user = userResults[0];

              // 세션에 사용자 정보 저장
              req.session.user = {
                idx: user.USER_IDX,
                status: user.USER_STATUS,
                category: user.USER_CATE,
                nick:user.USER_NICK
              };
              req.session.accessToken = accessToken; // Access Token 저장

              res.redirect('/'); // 메인 페이지로 이동
            } else {
              console.error('User not found after insertion.');
              res.status(500).send('Internal Server Error'); // 사용자에게 에러 메시지 전달
            }
          });
        });
      }
    });

  } catch (error) {
    console.error('Error during Kakao login:', error);
    res.status(500).send('Internal Server Error'); // 사용자에게 에러 메시지 전달
    next(error);
  }
});

router.get('/logout', async (req, res, next) => {
  try {
  

    // 로그아웃 후 세션 및 쿠키 삭제
    req.session.destroy((err) => {
      if (err) {
        console.error('세션 삭제 중 에러 발생:', err);
        return res.status(500).send('세션 삭제 중 에러가 발생했습니다.');
      } else {
        res.clearCookie('connect.sid'); // 세션 쿠키 삭제
        console.log('로그아웃 완료');
        // 로그아웃 후 메인 페이지로 리다이렉트
        res.redirect('/');
      }
    });
  } catch (error) {
    console.error('로그아웃 처리 중 에러 발생:', error);
    res.status(500).send('Internal Server Error'); // 에러 메시지 전달
    next(error);
  }
});

module.exports = router;