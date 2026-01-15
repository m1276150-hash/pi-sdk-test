const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// index.html 제공
app.use(express.static(path.join(__dirname, "public")));

// Pi API 기본 설정
const PI_API_URL = "https://api.minepi.com/v2";
const PI_API_KEY = "5vzpsblvjk2zbiusbgg4s5t7ogwtzb4dcrcrdaauzhcahrn5cjcnj8pwgwitbtzj";   // Developer Portal에서 발급받은 API Key

// 1) /me — 사용자 정보 요청
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

// 2) /payments — 결제 생성
app.post("/payments", async (req, res) => {
  try {
    const paymentData = req.body;

    const response = await axios.post(`${PI_API_URL}/payments`, paymentData, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });

    res.json(response.data);
  } catch (e) {
    res.status(500).json(e.response?.data || e);
  }
});

// 3) /payments/complete — 결제 완료 처리
app.post("/payments/complete", async (req, res) => {
  try {
    const paymentId = req.body.paymentId;

    const response = await axios.post(
      `${PI_API_URL}/payments/${paymentId}/complete`,
      {},
      { headers: { Authorization: `Key ${PI_API_KEY}` } }
    );

    res.json(response.data);
  } catch (e) {
    res.status(500).json(e.response?.data || e);
  }
});

// 서버 실행
app.listen(3000, () => {
  console.log("Pi Sandbox Node 서버 실행중: http://127.0.0.1:3000");
});