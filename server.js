import axios from 'axios';

export default async function handler(req, res) {
  // 1. CORS 설정: 새로운 통합 주소(netlify.app)를 허용 목록에 추가합니다.
  const origin = req.headers.origin;
  
  // 허용 리스트: Netlify 주소, 파이 샌드박스, 파이 공식 도메인
  const allowedOrigins = [
    'https://xpaio-token.netlify.app', 
    'https://sandbox.minepi.com',
    'https://pinet.com'
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.includes('minepi.com'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // OPTIONS 요청(Preflight) 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { paymentId } = req.body;
  const PI_API_KEY = "5vzpsblvjk2zbiusbgg4s5t7ogwtzb4dcrcrdaauzhcahrn5cjcnj8pwgwitbtzj";

  if (!paymentId) {
    return res.status(400).json({ success: false, error: "paymentId가 누락되었습니다." });
  }

  console.log(`[XPAIO] 결제 승인 시작 (Netlify 주소): ${paymentId}`);

  try {
    // 1단계: 파이 서버에 결제 승인(Approve) 요청
    await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });

    // 2단계: 파이 서버에 결제 완료(Complete) 요청
    const response = await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });

    return res.status(200).json({ 
      success: true, 
      txid: response.data.transaction?.txid 
    });

  } catch (e) {
    const errorDetail = e.response?.data || e.message;
    console.error("❌ 결제 처리 실패:", errorDetail);
    return res.status(500).json({ success: false, error: errorDetail });
  }
}