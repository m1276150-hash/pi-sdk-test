const StellarSDK = require("@stellar/stellar-sdk");
const SDK = StellarSDK.default || StellarSDK; // 최신 라이브러리 호환성 대응

// 1. 파이 테스트넷 서버 설정
const server = new SDK.Horizon.Server("https://api.testnet.minepi.com");
const NETWORK_PASSPHRASE = "Pi Testnet"; 

// 2. [수정 완료] 리더님의 A지갑(발행자) 정보
const issuerSecret = "SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA"; 
const issuerKeypair = SDK.Keypair.fromSecret(issuerSecret);

async function completeStep10() {
    try {
        console.log("--- [10단계] XPAIO 홈 도메인 등록 시작 ---");

        // 최신 네트워크 수수료 정보 가져오기
        const response = await server.ledgers().order("desc").limit(1).call();
        const baseFee = response.records[0].base_fee_in_stroops;

        // 발행자(A지갑) 계정 로드
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

        // 3. 트랜잭션 빌드: 홈 도메인 설정 (정식 도메인 연결)
        const transaction = new SDK.TransactionBuilder(issuerAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(90),
        })
        .addOperation(SDK.Operation.setOptions({ 
            // ✅ 파이 개발자 포털과 일치하도록 정식 도메인으로 수정
            // 반드시 https:// 를 제외하고 입력해야 합니다.
            homeDomain: "www.xpaio.com" 
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
        if (error.response && error.response.data && error.response.data.extras) {
            console.error(JSON.stringify(error.response.data.extras.result_codes));
        } else {
            console.error(error.message);
        }
    }
}

completeStep10();