import axios from 'axios';

export default async function handler(req, res) {
    // 1. CORS 설정: www가 없는 xpaio.com을 주력으로 허용합니다.
    const origin = req.headers.origin;
    
    // xpaio.com 관련 도메인 및 파이 네트워크 공식 도메인 허용
    if (origin && (origin === 'https://xpaio.com' || origin.includes('minepi.com') || origin.includes('pinet.com'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS 요청(Preflight) 즉시 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { paymentId } = req.body;
    // 리더님의 Secret API Key
    const PI_API_KEY = "5vzpsblvjk2zbiusbgg4s5t7ogwtzb4dcrcrdaauzhcahrn5cjcnj8pwgwitbtzj"; 

    if (!paymentId) {
        return res.status(400).json({ success: false, message: "paymentId가 누락되었습니다." });
    }

    console.log(`[XPAIO 서버] 결제 승인 프로세스 시작 (루트 도메인): ${paymentId}`);

    try {
        // 2. 파이 서버에 결제 승인(Approve) 요청
        await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`,
            {},
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );

        // 3. 파이 서버에 결제 완료(Complete) 요청
        const completeResponse = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`,
            {},
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );

        return res.status(200).json({ 
            success: true, 
            txid: completeResponse.data.transaction?.txid 
        });

    } catch (error) {
        const errorData = error.response?.data || error.message;
        console.error("❌ 서버 에러:", errorData);
        return res.status(500).json({ success: false, error: errorData });
    }
}