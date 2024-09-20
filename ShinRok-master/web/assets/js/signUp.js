document.getElementById('profile-pic').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const previewImg = document.getElementById('preview-img');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const nickname = document.getElementById('nickname').value;
    const profilePic = document.getElementById('profile-pic').files[0];

    if (nickname && profilePic) {
        // 여기서 서버로 데이터를 전송하는 코드를 추가하면 됩니다.
        alert('회원가입이 완료되었습니다!');
    } else {
        alert('모든 필드를 입력해주세요.');
    }
});
