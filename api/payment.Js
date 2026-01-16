import axios from 'axios';

export default async function handler(req, res) {
    // 1. CORS 설정 강화: 파이 브라우저의 다양한 접속 환경 허용
    // www가 붙은 주소와 pinet 주소 모두를 대응하기 위해 origin을 유연하게 처리합니다.
    const origin = req.headers.origin;
    if (origin && (origin.includes('xpaio.com') || origin.includes('minepi.com'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // OPTIONS 요청(Preflight) 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { paymentId } = req.body;
    // 리더님의 Secret API Key (보안상 환경변수 권장)
    const PI_API_KEY = "5vzpsblvjk2zbiusbgg4s5t7ogwtzb4dcrcrdaauzhcahrn5cjcnj8pwgwitbtzj"; 

    if (!paymentId) {
        return res.status(400).json({ success: false, message: "paymentId가 누락되었습니다." });
    }

    console.log(`[XPAIO 서버] 결제 승인 프로세스 시작: ${paymentId}`);

    try {
        // 3. 파이 서버에 결제 승인(Approve) 요청
        // 중요: 샌드박스 테스트 시에는 api.minepi.com 주소를 그대로 사용합니다.
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