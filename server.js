import axios from 'axios';

// Netlify용 서버리스 핸들러 (Express 대신 이 형식을 사용해야 합니다)
export default async function handler(req, res) {
  // 1. CORS 및 도메인 최적화 (www 제거 버전)
  const origin = req.headers.origin;
  
  // xpaio.com 관련 도메인 및 파이 공식 도메인만 허용하여 보안을 강화합니다.
  if (origin && (origin === 'https://xpaio.com' || origin.includes('minepi.com') || origin.includes('pinet.com'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // OPTIONS(사전 검사) 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST 요청만 수락
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { paymentId } = req.body;
  const PI_API_KEY = "5vzpsblvjk2zbiusbgg4s5t7ogwtzb4dcrcrdaauzhcahrn5cjcnj8pwgwitbtzj";

  if (!paymentId) {
    return res.status(400).json({ success: false, error: "paymentId가 없습니다." });
  }

  console.log(`[XPAIO] 결제 프로세스 시작 (루트 도메인): ${paymentId}`);

  try {
    // 1단계: 승인(Approve) - api.minepi.com 주소 유지
    await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });
    console.log(`[1/2] 승인 성공: ${paymentId}`);

    // 2단계: 완료(Complete)
    const response = await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });
    console.log(`[2/2] 최종 결제 완료: ${paymentId}`);

    // 성공 응답 반환
    return res.status(200).json({ 
      success: true, 
      txid: response.data.transaction?.txid 
    });

  } catch (e) {
    const errorDetail = e.response?.data || e.message;
    console.error("❌ 결제 처리 에러:", errorDetail);
    return res.status(500).json({ success: false, error: errorDetail });
  }
}