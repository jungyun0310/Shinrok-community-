// script.js



document.addEventListener("DOMContentLoaded", function() {
    var calendarEl = document.getElementById('calendar');
    var modal = document.getElementById("myModal");
    var span = document.getElementsByClassName("close")[0];
    var modalText = document.getElementById("modal-text");
    var diaryNameInput = document.getElementById('diaryName');
    var cancel = document.getElementById('cancel');
    var reg = document.getElementById('reg');
    var modalTextInput = document.getElementById('modalText');

    const images = document.querySelectorAll("#stk img");



    // FullCalendar 초기화
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        dateClick: function(info) {
            document.body.style.userSelect = 'none';
            modalText.innerText = `${info.dateStr}`;
            modal.style.display = "block";

            console.log(info.jsEvent);
            console.log(images);

            // 각 img 태그에 클릭 이벤트 리스너를 추가합니다
            images.forEach(function(img) {
                img.addEventListener("click", function(event){
                    const clickedImage = event.target;
                    const src =  clickedImage.src;

                    setDateImage(src,info);
                });
            });
        }
    });

    calendar.render();

    // // 이미지를 클릭했을 때 동작하는 함수
    function setDateImage(src,info){

        return function(){
            info.jsEvent.target.innerHTML = `<img width='50' height='50' src='${src}' alt='이미지없음' />`;
        }();
    }

    // 모달 닫기 버튼 클릭 시 모달 닫기
    span.onclick = function() {
        modal.style.display = "none";
    }

    // 모달 외부 클릭 시 모달 닫기
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    
    // 페이지 로드 시 저장된 다이어리 이름을 불러옴
    var savedDiaryName = localStorage.getItem('diaryName');
    if (savedDiaryName) {
        diaryNameInput.value = savedDiaryName;
    }

    // 다이어리 이름 변경 시 저장
    diaryNameInput.addEventListener('input', function() {
        localStorage.setItem('diaryName', diaryNameInput.value);
    });


    //  등록버튼 클릭 시 등록
    reg.onclick = function(event){
        event.preventDefault(); // 기본 폼 제출 동작 방지
        modalTextInput.value = modalText.innerText; // 숨겨진 필드에 값 설정
        document.getElementById('diaryForm').submit(); // 폼 제출
    }

    // 취소버튼 클릭 시 모달 닫기
    cancel.onclick = function() {
        modal.style.display = "none";
    }
});


// =================================================================================================



// 파일 로드 함수
function loadFile(input) {
    let file = input.files[0]; // 선택파일 가져오기

    let newImage = document.createElement("img"); //새 이미지 태그 생성

    //이미지 source 가져오기
    newImage.src = URL.createObjectURL(file);
    newImage.style.width = "100%"; //div에 꽉차게 넣으려고
    newImage.style.height = "100%";
    newImage.style.objectFit = "cover"; // div에 넘치지 않고 들어가게

    //이미지를 image-show div에 추가
    let container = document.getElementById('image-show');
    container.appendChild(newImage);
}
   