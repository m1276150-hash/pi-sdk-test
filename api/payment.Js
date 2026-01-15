import axios from 'axios';

export default async function handler(req, res) {
    // 1. CORS 설정: www.xpaio.com에서 오는 요청만 허용하여 보안 강화
    res.setHeader('Access-Control-Allow-Origin', 'https://www.xpaio.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청(Preflight) 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { paymentId } = req.body;
    // 리더님의 Secret API Key (보안상 환경변수 권장하나 일단 코드로 유지)
    const PI_API_KEY = "5vzpsblvjk2zbiusbgg4s5t7ogwtzb4dcrcrdaauzhcahrn5cjcnj8pwgwitbtzj"; 

    if (!paymentId) {
        return res.status(400).json({ success: false, message: "paymentId가 누락되었습니다." });
    }

    console.log(`[XPAIO 서버] 결제 승인 프로세스 시작: ${paymentId}`);

    try {
        // 3. 파이 서버에 결제 승인(Approve) 요청
        await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`,
            {},
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        console.log(`[1단계 성공] 승인 완료: ${paymentId}`);

        // 4. 파이 서버에 결제 완료(Complete) 요청
        const completeResponse = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`,
            {},
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        console.log(`[2단계 성공] 최종 결제 완료: ${paymentId}`);

        // 5. 성공 응답 반환
        return res.status(200).json({ 
            success: true, 
            txid: completeResponse.data.transaction?.txid 
        });

    } catch (error) {
        // 상세 에러 로깅 (10단계 디버깅용)
        const errorData = error.response?.data || error.message;
        console.error("❌ 결제 처리 중 서버 에러 발생:", errorData);
        
        return res.status(500).json({ 
            success: false, 
            error: errorData 
        });
    }
}