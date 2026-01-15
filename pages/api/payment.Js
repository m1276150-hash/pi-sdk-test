import axios from 'axios';

export default async function handler(req, res) {
    // 1. POST 요청만 허용 (보안)
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { paymentId } = req.body;
    // 리더님이 제공해주신 Secret Key 반영
    const PI_API_KEY = "6zyujyo7kwm6i3ae1qrwkyktdzuksafabjc6zpwdjamurqkpe0oy0v7yphnb9mle"; 

    console.log(`[XPAIO 서버] 결제 승인 프로세스 시작: ${paymentId}`);

    try {
        // 2. 파이 서버에 결제 승인(Approve) 요청
        await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`,
            {},
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        console.log(`[1단계 성공] 승인 완료: ${paymentId}`);

        // 3. 파이 서버에 결제 완료(Complete) 요청
        const completeResponse = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`,
            {},
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        console.log(`[2단계 성공] 최종 결제 완료: ${paymentId}`);

        // 4. 성공 응답 반환
        return res.status(200).json({ 
            success: true, 
            txid: completeResponse.data.transaction?.txid 
        });

    } catch (error) {
        console.error("❌ 결제 처리 중 서버 에러 발생:", error.response?.data || error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.response?.data || "서버 내부 통신 오류" 
        });
    }
}