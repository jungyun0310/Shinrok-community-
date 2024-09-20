require('dotenv').config({ path: '.env' });
const { S3Client } = require('@aws-sdk/client-s3');

// 환경 변수 설정
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const S3_REGION = process.env.S3_REGION;

// 환경 변수가 제대로 로드되었는지 확인
// console.log('S3_BUCKET:', S3_BUCKET);
// console.log('S3_ACCESS_KEY:', S3_ACCESS_KEY);
// console.log('S3_SECRET_KEY:', S3_SECRET_KEY);
// console.log('S3_REGION:', S3_REGION);

// AWS S3 클라이언트 설정
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
});

module.exports = { s3Client, S3_BUCKET, S3_REGION };
