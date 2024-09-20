import pymysql
import asyncio
from predict import predict_image 
from db import db_con  
import os
import requests
import tempfile

# 이미지 다운로드 함수
def download_image(url, save_path):
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(save_path, 'wb') as out_file:
            out_file.write(response.content)
    else:
        raise Exception(f"Failed to download image from {url}")

async def fetch_image_and_crop(user_idx):
    connection = db_con()
    cursor = connection.cursor()

    try:
        # 가장 최근에 추가된 값 가져오기
        cursor.execute("""
            SELECT DSS_IDX, DSS_PLANT, DSS_IMG 
            FROM SR_DSS 
            WHERE USER_IDX = %s AND DSS_STATE IS NULL 
            ORDER BY DSS_DATE DESC 
            LIMIT 1
        """, (user_idx,))
        result = cursor.fetchone()
        print(f"Database query result: {result}")  # 쿼리 결과 로그 추가
        if result:
            dss_idx, dss_plant, dss_img = result
            print(f"Fetched data: {result}")  # 로그 추가
            return dss_idx, dss_plant, dss_img
        else:
            print(f"No data found for USER_IDX: {user_idx}")  # 로그 추가
            return None, None, None

    except pymysql.MySQLError as e:
        print(f"Error while fetching data from database: {e}")
        return None, None, None

    finally:
        cursor.close()
        connection.close()

async def predict_and_update(user_idx):
    # 이미지 경로와 작물 이름을 데이터베이스에서 가져오기
    dss_idx, crop_name, image_path = await fetch_image_and_crop(user_idx)
    if not dss_idx or not crop_name or not image_path:
        print(f"No data found in predict_and_update for user_idx: {user_idx}, dss_idx: {dss_idx}, crop_name: {crop_name}, image_path: {image_path}")
        return None

    # 임시 파일 경로 설정
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        local_image_path = tmp_file.name

    try:
        download_image(image_path, local_image_path)
    except Exception as e:
        print(f"Failed to download image: {e}")
        return None

    # 이미지 예측 수행
    predicted_label, disease_name_or_idx = await asyncio.to_thread(predict_image, local_image_path, crop_name)

    # 다운로드한 이미지 파일 삭제
    if os.path.exists(local_image_path):
        os.remove(local_image_path)
    
    # 데이터베이스 연결
    connection = db_con()
    cursor = connection.cursor()

    try:
        # disease_name_or_idx가 문자열(정상 또는 병명)인지 정수형인지 확인
        if isinstance(disease_name_or_idx, str):
            disease_name = disease_name_or_idx
            if disease_name == "정상":
                query = """
                UPDATE SR_DSS
                SET DSS_STATE=%s, DSS_DISC='정상', DSS_PREV='정상', DSS_RES=%s
                WHERE DSS_IDX=%s
                """
                cursor.execute(query, (disease_name, predicted_label, dss_idx))
            else:
                # DSSSTORE에서 병명으로 값을 가져오기
                cursor.execute("SELECT DSS_DISC, DSS_PREV FROM SR_DSSSTORE WHERE DSS_STATE=%s", (disease_name,))
                dssstore_result = cursor.fetchone()
                if not dssstore_result:
                    print(f"No DSSSTORE data found for disease name: {disease_name}")
                    return None

                # 예측 결과를 SR_DSS 테이블에 업데이트
                query = """
                UPDATE SR_DSS
                SET DSS_STATE=%s, DSS_DISC=%s, DSS_PREV=%s, DSS_RES=%s
                WHERE DSS_IDX=%s
                """
                cursor.execute(query, (disease_name, dssstore_result[0], dssstore_result[1], predicted_label, dss_idx))
        else:
            # disease_name_or_idx가 정수형인 경우
            disease_idx = disease_name_or_idx
            query = """
            UPDATE SR_DSS
            SET DSS_STATE=%s, DSS_PLANT=%s, DSS_DISC='정상', DSS_PREV='정상', DSS_RES=%s
            WHERE DSS_IDX=%s
            """
            cursor.execute(query, (disease_idx, crop_name, predicted_label, dss_idx))

        connection.commit()

        # 업데이트된 데이터 확인 (옵션)
        cursor.execute("SELECT * FROM SR_DSS WHERE DSS_IDX=%s", (dss_idx,))
        result = cursor.fetchone()
        print(f"Update query result: {result}")  # 업데이트된 데이터 로그 추가
        
        return predicted_label, disease_name_or_idx

    except pymysql.MySQLError as e:
        print(f"Error while updating database: {e}")
        connection.rollback()
        return None

    finally:
        cursor.close()
        connection.close()
