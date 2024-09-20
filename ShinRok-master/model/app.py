from quart import Quart, request, jsonify
import asyncio
from evaluate import predict_and_update
import aiohttp

app = Quart(__name__)

@app.route('/predict', methods=['POST'])
async def predict():
    data = await request.get_json()
    print(f"Received request data: {data}")  # 요청 데이터 로그 추가
    user_idx = data.get('idx')
    
    if user_idx:
        try:
            print(f"Received request with idx: {user_idx}")  # 로그 추가
            result = await predict_and_update(user_idx)
            if not result:
                print("No prediction result found.")  # 로그 추가
                return jsonify({"error": "No data found"}), 404
            
            prediction, disease_name = result
            print(f"Prediction: {prediction}, Disease Name: {disease_name}")  # 예측 결과 로그 추가

            # 예측이 완료되면 localhost:3000/로 리다이렉트
            return jsonify({"redirect": "http://localhost:3000//predict/result"})
        except Exception as e:
            print(f"Exception occurred: {e}")  # 예외 로그 추가
            return jsonify({"error": str(e)}), 500
    
    print("Invalid request. No user_idx provided.")  # 로그 추가
    return jsonify({"error": "Invalid request"}), 400

if __name__ == '__main__':
    app.run(port=5000, debug=True)
