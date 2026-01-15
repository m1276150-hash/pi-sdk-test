const StellarSDK = require("@stellar/stellar-sdk");

// 1. 파이 테스트넷 서버 설정
const server = new StellarSDK.Horizon.Server("https://api.testnet.minepi.com");
const NETWORK_PASSPHRASE = "Pi Testnet"; 

// 2. [수정 완료] 리더님이 주신 A지갑(발행자) 정보
const issuerSecret = "SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA"; 
const issuerKeypair = StellarSDK.Keypair.fromSecret(issuerSecret);

async function completeStep10() {
    try {
        console.log("--- [10단계] XPAIO 홈 도메인 등록 시작 ---");

        // 최신 네트워크 수수료 정보 가져오기
        const response = await server.ledgers().order("desc").limit(1).call();
        const baseFee = response.records[0].base_fee_in_stroops;

        // 발행자(A지갑) 계정 로드
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

        // 3. 트랜잭션 빌드: 홈 도메인 설정 (Netlify 주소 연결)
        const transaction = new StellarSDK.TransactionBuilder(issuerAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(90),
        })
        .addOperation(StellarSDK.Operation.setOptions({ 
            // 🚨 Netlify 배포 후 받은 실제 주소로 수정하세요 (예: xpaio-token.netlify.app)
            // 반드시 https:// 를 제외하고 입력해야 합니다.
            homeDomain: "xpaio-token.netlify.app" 
        }))
        .setTimeout(180) 
        .build();

        // 서명 및 전송
        transaction.sign(issuerKeypair); 
        const result = await server.submitTransaction(transaction);

        console.log("✅ 성공! A지갑에 Netlify 도메인이 등록되었습니다.");
        console.log("🔗 트랜잭션 확인:", result._links.transaction.href);
        console.log("\n--- 이제 파이 브라우저에서 10단계가 승인됩니다! ---");

    } catch (error) {
        console.error("❌ 등록 실패:", error.response?.data?.extras?.result_codes || error);
    }
}

completeStep10();