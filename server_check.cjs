const express = require('express');
const cors = require('cors');
const app = express();

// 파이 네트워크의 접속을 허용하는 CORS 설정
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST']
}));

app.get('/', (req, res) => {
    res.send('🚀 XPAIO 서버가 정상 작동 중입니다! URL 연결 확인 완료.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`🌐 앱 주소: https://리더님의_도메인_주소:${PORT}`);
    console.log(`📢 위 주소를 파이 대시보드의 'App URL'에 입력하세요.`);
    console.log(`-----------------------------------------`);
});