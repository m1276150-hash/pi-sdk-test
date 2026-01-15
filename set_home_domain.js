const StellarSDK = require('@stellar/stellar-sdk');
const SDK = StellarSDK.default || StellarSDK;

// 1. 파이 테스트넷 연결 설정
const server = new SDK.Horizon.Server("https://api.testnet.minepi.com");
const NETWORK_PASSPHRASE = "Pi Testnet";

// 2. [A지갑] 발행자 정보 (SAR6Q... / GDMHO...)
const ISSUER_SECRET = 'SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA';
const issuerKeypair = SDK.Keypair.fromSecret(ISSUER_SECRET);

// 3. 리더님의 넷리파이 도메인 주소 (https:// 제외)
const HOME_DOMAIN = "xpaio.netlify.app";

async function setHomeDomain() {
    try {
        console.log("⏳ 파이 블록체인에 홈 도메인 등록 중...");
        
        // 최신 계정 정보 및 수수료 로드
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
        const currentFee = (await server.ledgers().order("desc").limit(1).call()).records[0].base_fee_in_stroops;

        // 4. 트랜잭션 빌드 (SetOptions 오퍼레이션 사용)
        const transaction = new SDK.TransactionBuilder(issuerAccount, {
            fee: currentFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(180),
        })
        .addOperation(SDK.Operation.setOptions({ 
            homeDomain: HOME_DOMAIN 
        }))
        .setTimeout(180)
        .build();

        // 5. 서명 및 제출
        transaction.sign(issuerKeypair);
        const result = await server.submitTransaction(transaction);

        console.log(`\n🎉 [성공] ${HOME_DOMAIN} 등록 완료!`);
        console.log(`🔗 확인 링크: ${result._links.transaction.href}`);
        console.log("\n이제 파이 브라우저에서 10단계 승인을 기다리시면 됩니다.");

    } catch (e) {
        console.error("\n❌ 등록 실패:");
        if (e.response && e.response.data) {
            console.error(JSON.stringify(e.response.data.extras.result_codes));
        } else {
            console.error(e.message);
        }
    }
}

setHomeDomain();