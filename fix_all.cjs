const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

// 1. 돈(테스트 파이)이 들어있는 리더님의 '개인 지갑' 비밀번호 (S...)
const MY_PERSONAL_SECRET = 'SDEGJINVIJ5M3BQR75C5AHXDEZESEG7PTE2B2CIRACD6YUWYRSHEGNL5'; 
const ISSUER_ADDR = 'GDMHOZS5A6QZFI55WMGLZRAJMYUC5WEEMCEYY6JS5WVTTSGK4XLZQUVR';
const ISSUER_SECRET = 'SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA';

async function fix() {
    try {
        console.log('⏳ 1단계: 개인 지갑 연결 확인 중...');
        const personalKeypair = StellarSdk.Keypair.fromSecret(MY_PERSONAL_SECRET.trim());
        const issuerKeypair = StellarSdk.Keypair.fromSecret(ISSUER_SECRET.trim());

        const personalAccount = await server.loadAccount(personalKeypair.publicKey());
        console.log('✅ 개인 지갑 연결 성공 (잔액 있음)');

        const tx1 = new StellarSdk.TransactionBuilder(personalAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
        .addOperation(StellarSdk.Operation.createAccount({
            destination: ISSUER_ADDR,
            startingBalance: '5' 
        }))
        .setTimeout(30).build();

        tx1.sign(personalKeypair);
        await server.submitTransaction(tx1);
        console.log('✅ 1단계 성공: 발행자 지갑이 활성화되었습니다.');

        console.log('⏳ 2단계: 발행자 지갑으로 홈 도메인 등기 중...');
        const issuerAccount = await server.loadAccount(ISSUER_ADDR);
        const tx2 = new StellarSdk.TransactionBuilder(issuerAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
        .addOperation(StellarSdk.Operation.setOptions({
            homeDomain: 'www.xpaio.com'
        }))
        .setTimeout(30).build();

        tx2.sign(issuerKeypair);
        await server.submitTransaction(tx2);
        console.log('✅ 2단계 성공: www.xpaio.com 등기 완료!');

    } catch (e) {
        console.error('❌ 실패 상세 정보:');
        if (e.response && e.response.data) {
            console.error(JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }
}
fix();