const StellarSDK = require('@stellar/stellar-sdk');
const SDK = StellarSDK.default || StellarSDK;

// 1. 파이 테스트넷 연결 설정
const server = new SDK.Horizon.Server("https://api.testnet.minepi.com");
// 💡 중요 수정: 파이 테스트넷 공식 식별자로 일치
const NETWORK_PASSPHRASE = "Pi Network Testnet"; 

// 2. [A지갑] 발행자 정보
const ISSUER_SECRET = 'SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA';
const issuerKeypair = SDK.Keypair.fromSecret(ISSUER_SECRET);

// 3. 파이 개발자 포털과 100% 일치해야 하는 도메인 주소
const HOME_DOMAIN = "www.xpaio.com"; 

async function setHomeDomain() {
    try {
        console.log(`⏳ 파이 블록체인에 홈 도메인(${HOME_DOMAIN}) 등록 중...`);
        
        // 최신 계정 정보 로드
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
        
        // 최신 네트워크 수수료 조회
        const ledgers = await server.ledgers().order("desc").limit(1).call();
        const currentFee = ledgers.records[0].base_fee_in_stroops;

        // 4. 트랜잭션 빌드 (SetOptions 오퍼레이션 사용)
        const transaction = new SDK.TransactionBuilder(issuerAccount, {
            fee: currentFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(180),
        })
        .addOperation(SDK.Operation.setOptions({ 
            // ✅ www를 포함한 도메인을 블록체인 지갑 데이터에 박아넣습니다.
            homeDomain: HOME_DOMAIN 
        }))
        .build();

        // 5. 서명 및 제출
        transaction.sign(issuerKeypair);
        const result = await server.submitTransaction(transaction);

        console.log(`\n🎉 [성공] ${HOME_DOMAIN} 등록 완료!`);
        console.log(`🔗 확인 링크: ${result._links.transaction.href}`);
        console.log("\n이제 파이 시스템이 이 도메인을 공식 주소로 인식합니다.");

    } catch (e) {
        console.error("\n❌ 등록 실패:");
        if (e.response?.data?.extras?.result_codes) {
            console.error(JSON.stringify(e.response.data.extras.result_codes));
        } else {
            console.error(e.message);
        }
    }
}

setHomeDomain();