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

// document.getElementById("changeBtn").addEventListener("click", (e)=>{
//     e.preventDefault();
//     window.location.href="/changePost"
// })

// 게시판 등록에서 취소버튼을 클릭할 시 메인으로 돌아가는 이벤트 ----------
document.getElementById("cancelBtn").addEventListener("click", (e)=> {
    e.preventDefault();
    window.location.href="/"
})

// 등록 버튼을 클릭할 시 등록한 게시물의 상세페이지로 이동하게 함
// document.getElementById("uploadBtn").addEventListener("click", (e)=> {
//     e.preventDefault();
//     window.location.href="/board/detailPost"
// })


// 모달 열기
var modal = document.getElementById("commentModal");
var btn = document.getElementById("openModal");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
    modal.style.display = "block";
}

// 모달 닫기
span.onclick = function() {
    modal.style.display = "none";
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}