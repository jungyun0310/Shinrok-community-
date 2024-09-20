import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np

# disease_code_to_name 사전 정의
disease_code_to_name = {
    0: "정상",
    1: "가지잎말이병",
    2: "가지점무늬병",
    3: "고추마일드모틀바이러스병",
    4: "고추탄저병",
    5: "단호박흰가루병",
    6: "딸기잿빛곰팡이병",
    7: "딸기흰가루병",
    8: "상추균핵병",
    9: "상추노균병",
    10: "수박덩굴마름병",
    11: "수박흰가루병",
    12: "애호박흰가루병",
    13: "오이노균병",
    14: "오이모자이크바이러스",
    15: "주키니황화모자이크바이러스",
    16: "참외녹반모무늬병",
    17: "참외흰가루병",
    18: "토마토잎곰팡이병",
    19: "토마토황화잎말림바이러스병",
    20: "포도노균병"
}

crop_disease_mapping = {
    "가지": {0: 0, 1: 1, 2: 2},
    "고추": {0: 0, 1: 3, 2: 4},
    "단호박": {0: 0, 1: 5},
    "딸기": {0: 0, 1: 6, 2: 7},
    "상추": {0: 0, 1: 8, 2: 9},
    "수박": {0: 0, 1: 10, 2: 11},
    "애호박": {0: 0, 1: 12},
    "오이": {0: 0, 1: 13, 2: 14},
    "주키니호박": {0: 0, 1: 15},
    "참외": {0: 0, 1: 16, 2: 17},
    "토마토": {0: 0, 1: 18, 2: 19},
    "포도": {0: 0, 1: 20}
}

# 학습된 모델 정의
class CustomResNet50(nn.Module):
    def __init__(self, num_classes):
        super(CustomResNet50, self).__init__()
        self.resnet = models.resnet50(weights='IMAGENET1K_V1')
        num_ftrs = self.resnet.fc.in_features
        
        # ResNet50의 기존 마지막 층을 드롭아웃, 추가적인 FC 층 및 ReLU 활성화로 교체
        self.resnet.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_ftrs, 1024),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(1024, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        return self.resnet(x)

# 학습된 모델 로드
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
model_path = './model/model_resnet50.pth'

# 기존 모델을 3개의 클래스로 설정하여 로드 (예: 3개 클래스)
model = CustomResNet50(num_classes=3)
model.load_state_dict(torch.load(model_path, map_location=device))

# 새로운 클래스 수에 맞게 마지막 레이어를 재정의
new_num_classes = len(disease_code_to_name)  # 새로운 클래스 수 (21개 클래스)
num_ftrs = model.resnet.fc[1].in_features
model.resnet.fc = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(num_ftrs, 1024),
    nn.ReLU(),
    nn.Dropout(0.5),
    nn.Linear(1024, 512),
    nn.ReLU(),
    nn.Dropout(0.5),
    nn.Linear(512, new_num_classes)
)

model = model.to(device)
model.eval()

# 이미지 전처리 함수
preprocess = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# 이미지 예측 함수
def predict_image(image_path, crop_name):
    if crop_name not in crop_disease_mapping:
        raise ValueError(f"Invalid crop name: {crop_name}")

    image = Image.open(image_path).convert("RGB")
    image = preprocess(image)
    image = image.unsqueeze(0)  # 배치 차원 추가
    image = image.to(device)

    with torch.no_grad():
        outputs = model(image)
        probabilities = nn.Softmax(dim=1)(outputs)
        probabilities = probabilities.cpu().numpy().flatten()
        
        # crop_disease_mapping에서 crop_name에 해당하는 질병만 추출
        valid_labels = list(crop_disease_mapping[crop_name].values())
        valid_probabilities = {label: probabilities[label] for label in valid_labels}
        
        # 가장 높은 확률을 가진 질병 찾기
        predicted_label = max(valid_probabilities, key=valid_probabilities.get)
        disease_name = disease_code_to_name.get(predicted_label, "Unknown")
        
    return predicted_label, disease_name
