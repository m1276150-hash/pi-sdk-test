// Netlify 환경에서는 express 대신 이 핸들러 형식을 사용합니다.
export default async function handler(req, res) {
  // 1. CORS 설정: 모든 접속을 허용하여 파이 브라우저 연결을 돕습니다.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리 (사전 검사)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. 접속 확인 메시지 (루트 주소 접속 시)
  return res.status(200).send('🚀 XPAIO 서버가 정상 작동 중입니다! URL 연결 확인 완료 (xpaio.com).');
}