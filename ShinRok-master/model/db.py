import pymysql
import os
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

# db연결
def db_con():
    return pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        db=os.getenv('DB_NAME'),
        port=int(os.getenv('DB_PORT')),
        charset='utf8'
    )
