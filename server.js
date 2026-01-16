import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. 보안 설정: 파이 브라우저 및 정식 도메인 허용
app.use(cors({
  origin: [
    "https://www.xpaio.com", 
    "https://xpaio.com", 
    "https://sandbox.minepi.com", // 샌드박스 테스트 필수 허용
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// 정적 파일 제공 (필요 시)
app.use(express.static(path.join(__dirname, 'public')));

// Pi API 설정
const PI_API_URL = "https://api.minepi.com/v2";
const PI_API_KEY = "5vzpsblvjk2zbiusbgg4s5t7ogwtzb4dcrcrdaauzhcahrn5cjcnj8pwgwitbtzj";

/**
 * [핵심] 결제 승인 및 완료 처리 (10단계 필수 로직)
 * 중요: index.html의 fetch 주소와 반드시 일치해야 합니다.
 */
app.post("/payment", async (req, res) => {
  const { paymentId } = req.body;
  
  if (!paymentId) {
    return res.status(400).json({ success: false, error: "paymentId가 없습니다." });
  }

  console.log(`[XPAIO] 결제 프로세스 시작: ${paymentId}`);

  try {
    // 1단계: 승인(Approve)
    await axios.post(`${PI_API_URL}/payments/${paymentId}/approve`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });
    console.log(`[1/2] 승인 완료: ${paymentId}`);

    // 2단계: 완료(Complete)
    const response = await axios.post(`${PI_API_URL}/payments/${paymentId}/complete`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });
    console.log(`[2/2] 최종 결제 완료: ${paymentId}`);

    res.json({ success: true, txid: response.data.transaction?.txid });

  } catch (e) {
    const errorDetail = e.response?.data || e.message;
    console.error("❌ 결제 처리 에러:", errorDetail);
    res.status(500).json({ success: false, error: errorDetail });
  }
});

// 사용자 정보 확인 API
app.get("/me", async (req, res) => {
  try {
    const response = await axios.get(`${PI_API_URL}/me`, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });
    res.json(response.data);
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

// Render 배포 포트 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================`);
  console.log(`🚀 XPAIO 통합 서버 가동 완료`);
  console.log(`🔗 Endpoint: https://xpaio-server.onrender.com/payment`);
  console.log(`================================================`);
});