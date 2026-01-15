const express = require('express');
const axios = require('axios'); // 파이 서버와 통신하기 위해 필요
const app = express();

// JSON 본문을 읽기 위한 설정
app.use(express.json());

// [필수 수정 사항 2 반영] 정적 파일 제공 (index.html이 있는 폴더)
app.use(express.static('public')); 

// 리더님의 진짜 Secret API Key (개발자 포털 맨 아래 발급본)
const PI_API_KEY = "5vzpsblvjk2zbiusbgg4s5t7ogwtzb4dcrcrdaauzhcahrn5cjcnj8pwgwitbtzj"; 

/**
 * [필수 수정 사항 2 반영] 서버 API 엔드포인트
 * 경로: /xpaio-token/app/adi/payment
 */
app.post('/xpaio-token/app/adi/payment', async (req, res) => {
    const { paymentId } = req.body;
    console.log(`[결제 요청 수신] ID: ${paymentId}`);

    try {
        // 1. 파이 서버에 결제 승인(Approve) 요청
        const approveResponse = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`,
            {},
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        console.log(`[1단계: 승인 완료] ${paymentId}`);

        // 2. 파이 서버에 결제 완료(Complete) 요청
        const completeResponse = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`,
            {},
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        console.log(`[2단계: 최종 완료] ${paymentId}`);

        // 클라이언트(index.html)에 성공 응답 전달
        res.status(200).json({ success: true, message: "결제가 성공적으로 처리되었습니다." });

    } catch (error) {
        console.error("[결제 처리 오류]", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response ? error.response.data : "서버 통신 오류" 
        });
    }
});

// 로컬 서버 실행 포트 설정
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`XPAIO 로컬 정석 서버가 가동되었습니다.`);
    console.log(`접속 주소: http://localhost:${PORT}/?sandbox=1`);
    console.log(`================================================`);
});