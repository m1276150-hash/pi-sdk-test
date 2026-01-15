import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. 보안 설정: 리더님의 정식 도메인에서 오는 요청만 허용
app.use(cors({
  origin: ["https://www.xpaio.com", "http://localhost:3000"]
}));
app.use(express.json());

// 정적 파일(index.html 등) 제공 경로
app.use(express.static(path.join(__dirname, 'public')));

// Pi API 설정
const PI_API_URL = "https://api.minepi.com/v2";
const PI_API_KEY = "5vzpsblvjk2zbiusbgg4s5t7ogwtzb4dcrcrdaauzhcahrn5cjcnj8pwgwitbtzj";

/**
 * [핵심] 결제 승인 및 완료 처리 (10단계 필수 로직)
 * 리더님의 index.html에서 호출하는 엔드포인트입니다.
 */
app.post("/xpaio-token/app/adi/payment", async (req, res) => {
  const { paymentId } = req.body;
  console.log(`[XPAIO] 결제 프로세스 시작: ${paymentId}`);

  try {
    // 1단계: 승인(Approve) - 파이 서버에 결제를 승인한다고 알림
    await axios.post(`${PI_API_URL}/payments/${paymentId}/approve`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });
    console.log(`[1/2] 승인 완료: ${paymentId}`);

    // 2단계: 완료(Complete) - 결제를 최종적으로 마무리
    const response = await axios.post(`${PI_API_URL}/payments/${paymentId}/complete`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });
    console.log(`[2/2] 최종 결제 완료: ${paymentId}`);

    res.json({ success: true, txid: response.data.transaction?.txid });

  } catch (e) {
    console.error("❌ 결제 처리 에러:", e.response?.data || e.message);
    res.status(500).json({ success: false, error: e.response?.data || "서버 통신 오류" });
  }
});

/**
 * 사용자 정보 확인 API
 */
app.post("/me", async (req, res) => {
  try {
    const response = await axios.post(`${PI_API_URL}/me`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });
    res.json(response.data);
  } catch (e) {
    res.status(500).json(e.response?.data || e);
  }
});

// Render 배포 호환 포트 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`🚀 XPAIO 통합 서버 가동: http://localhost:${PORT}`);
  console.log(`================================================`);
});