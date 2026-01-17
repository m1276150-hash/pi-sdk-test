const StellarSdk = require('stellar-sdk');

// 1. 테스트넷 서버로 강제 고정
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

// 2. 발행자 지갑(A)의 비밀 구절 (S...)
const SECRET_KEY = 'SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA'; 
const sourceKeypair = StellarSdk.Keypair.fromSecret(SECRET_KEY.trim());

async function setHomeDomain() {
    try {
        console.log('⏳ 발행자 지갑 상태 확인 중...');
        // 지갑 정보를 서버에서 가져옵니다.
        const account = await server.loadAccount(sourceKeypair.publicKey());
        console.log('✅ 지갑 확인 완료! 등기를 시작합니다.');

        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET, // 테스트넷 네트워크로 강제 설정
        })
        .addOperation(StellarSdk.Operation.setOptions({
            homeDomain: 'www.xpaio.com' // 리더님의 도메인
        }))
        .setTimeout(30)
        .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);
        console.log('✅ [대성공] www.xpaio.com 등기가 블록체인에 완료되었습니다!');
        console.log('트랜잭션 해시:', result.hash);

    } catch (e) {
        console.error('❌ 실패 상세 원인:');
        if (e.response && e.response.data) {
            console.error(JSON.stringify(e.response.data.extras.result_codes, null, 2));
        } else {
            console.error(e.message);
        }
    }
}

setHomeDomain();