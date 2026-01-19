const StellarSDK = require("@stellar/stellar-sdk");
const SDK = StellarSDK.default || StellarSDK; 

// 1. 파이 테스트넷 서버 설정
const server = new SDK.Horizon.Server("https://api.testnet.minepi.com");
// 💡 중요 수정: 파이 테스트넷 공식 식별자로 일치
const NETWORK_PASSPHRASE = "Pi Network Testnet"; 

// 2. 리더님의 A지갑(발행자) 정보
const issuerSecret = "SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA"; 
const issuerKeypair = SDK.Keypair.fromSecret(issuerSecret);

async function completeStep10() {
    try {
        console.log("--- [10단계] XPAIO 홈 도메인 등록 시작 ---");

        // 발행자(A지갑) 계정 로드
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

        // 3. 트랜잭션 빌드: 홈 도메인 설정
        const transaction = new SDK.TransactionBuilder(issuerAccount, {
            // 💡 팁: 수동 계산보다 100,000 (0.1 Pi) 정도로 넉넉히 설정하는 것이 실패가 없습니다.
            fee: "100000", 
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(SDK.Operation.setOptions({ 
            // ✅ 파이 시스템이 검증할 도메인 (www 포함)
            homeDomain: "xpaio.com" 
        }))
        .setTimeout(180) 
        .build();

        // 서명 및 전송
        transaction.sign(issuerKeypair); 
        const result = await server.submitTransaction(transaction);

        console.log("✅ 성공! A지갑에 www.xpaio.com 도메인이 등록되었습니다.");
        console.log("🔗 트랜잭션 확인:", result._links.transaction.href);
        console.log("\n--- 이제 파이 브라우저에서 10단계가 승인됩니다! ---");

    } catch (error) {
        console.error("❌ 등록 실패:");
        if (error.response?.data?.extras?.result_codes) {
            console.error(JSON.stringify(error.response.data.extras.result_codes));
        } else {
            console.error(error.message);
        }
    }
}

completeStep10();