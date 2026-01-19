// 최신 Stellar SDK 방식에 맞게 수정
const StellarSdk = require('stellar-sdk');

// Horizon 서버 설정 (최신 방식)
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

// [주의] 발행자 지갑(Issuer)의 S로 시작하는 비밀구절을 정확히 입력하세요.
const SECRET_KEY = 'SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA'; 
const sourceKeypair = StellarSdk.Keypair.fromSecret(SECRET_KEY.trim());

async function setHomeDomain() {
    try {
        console.log('⏳ 파이 블록체인에 홈 도메인(www.xpaio.com) 등록 시도 중...');
        
        const account = await server.loadAccount(sourceKeypair.publicKey());
        
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
        .addOperation(StellarSdk.Operation.setOptions({
            homeDomain: 'xpaio.com' 
        }))
        .setTimeout(30)
        .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);
        
        console.log('✅ [성공] www.xpaio.com 등기 완료!');
        console.log('트랜잭션 해시:', result.hash);
        console.log('이제 파이 브라우저에서 무한로딩이 사라질 것입니다!');
        
    } catch (e) {
        console.error('❌ 실패 이유:');
        if (e.response && e.response.data && e.response.data.extras) {
            console.error(JSON.stringify(e.response.data.extras.result_codes));
        } else {
            console.error(e.message);
        }
    }
}

setHomeDomain();