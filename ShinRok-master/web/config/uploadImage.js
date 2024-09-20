const { s3Client, S3_BUCKET, S3_REGION } = require('./aws');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const uploadImage = async (filePath, folder = '') => {
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const key = folder ? `${folder}/${fileName}` : fileName;  // 폴더명 지정

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: 'image/jpeg',
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    const imageUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
    console.log(`Image uploaded successfully. URL: ${imageUrl}`);
    return imageUrl;
  } catch (err) {
    console.error(`Image upload failed: ${err.message}`);
    throw new Error('Image upload failed');
  }
};

module.exports = uploadImage;
