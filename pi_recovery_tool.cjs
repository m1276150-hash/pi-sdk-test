const PiNetwork = require('pi-backend').default;
const dotenv = require('dotenv');
const path = require('path');

// 1. .env.testnet 로드 및 결과 즉시 확인
const envPath = path.resolve(__dirname, '.env.testnet');
const result = dotenv.config({ path: envPath });

console.log("-----------------------------------------");
if (result.error) {
    console.error("❌ [.env.testnet] 파일을 읽지 못했습니다. 파일이 존재하는지 확인하세요.");
    process.exit(1);
} else {
    console.log("✅ 설정 파일(.env.testnet) 로드 성공");
}

const apiKey = process.env.PI_API_KEY;
const walletPrivateSeed = process.env.PI_WALLET_PRIVATE_SEED;

// 2. SDK 초기화 시작
console.log("🔑 SDK 초기화를 시작합니다...");
const pi = new PiNetwork(apiKey, walletPrivateSeed);
console.log("✅ SDK 초기화 완료");

async function clearIncompletePayments() {
    console.log("🚀 XPAIO 보안 통로 분석을 시작합니다...");
    try {
        const response = await pi.getIncompleteServerPayments();
        
        // 응답 데이터 구조를 강제로 배열화 (지난번 에러 해결책)
        const incompletePayments = Array.isArray(response) ? response : (response.incomplete_server_payments || []);
        
        if (incompletePayments.length === 0) {
            console.log("✨ [결과] 현재 막혀있는 결제가 없습니다! 샌드박스 인증이 가능한 깨끗한 상태입니다.");
        } else {
            console.log(`⚠️ [결과] ${incompletePayments.length}개의 정체된 결제를 발견했습니다. 삭제 중...`);
            for (const payment of incompletePayments) {
                console.log(`- ID: ${payment.identifier} 삭제 시도...`);
                await pi.cancelPayment(payment.identifier);
            }
            console.log("🎯 [완료] 모든 장애물을 제거했습니다!");
        }
    } catch (error) {
        console.error("❌ [오류] 파이 서버 연결 실패:", error.message);
        if (error.response && error.response.data) {
            console.error("👉 상세 내용:", JSON.stringify(error.response.data));
        }
    }
    console.log("-----------------------------------------");
}

// 비동기 함수 실행
clearIncompletePayments();