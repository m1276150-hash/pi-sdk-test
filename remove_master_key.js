// D:\xpaio\index.html 파일 내 <script> 태그 안의 checkPiStatus() 함수 수정

function checkPiStatus() {
    const statusElement = document.getElementById('sdkStatus');
    
    if (window.Pi) {
        // Pi SDK가 성공적으로 로드되었는지 확인
        statusElement.textContent = "✅ Pi SDK가 성공적으로 로드되었습니다. (Version: 2.0)";
        statusElement.style.color = "green";

        // 🚨 Pi.authenticate()에 'scopes' 매개변수를 추가하여 오류 해결 🚨
        Pi.authenticate({ scopes: ['username', 'payments'] }).then(user => {
            console.log("Pi 인증 성공. 사용자 ID:", user.uid);
            statusElement.innerHTML += `<br>✅ Pi 사용자 인증 성공: ${user.username}`;
        }).catch(error => {
            console.error("Pi 인증 실패:", error);
            // 오류 메시지가 깔끔하게 표시되도록 수정
            const errorMessage = error.message || (error.stack && error.stack.split('\n')[0]) || error;
            statusElement.innerHTML += `<br>❌ Pi 사용자 인증 실패: ${errorMessage}`;
            statusElement.style.color = "red";
        });
        
    } else {
        statusElement.textContent = "❌ Pi SDK를 찾을 수 없습니다. Pi Browser에서 접속했는지 확인하세요.";
        statusElement.style.color = "red";
    }
}