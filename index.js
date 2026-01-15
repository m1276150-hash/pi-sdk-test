const StellarSdk = require('@stellar/stellar-sdk');

// 1. 파이 테스트넷 네트워크 설정 (권장 방식)
const server = new StellarSdk.Server('https://api.testnet.minepi.com');
const NETWORK_PASSPHRASE = 'Pi Testnet';

// 2. 지갑 정보 (A = 발행자 GDMHO... / B = 유통자 GDPJP...)
// 발행자(A)의 비밀키가 반드시 정확해야 합니다.
const issuerKeys = StellarSdk.Keypair.fromSecret('SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA'); 
const distributorKeys = StellarSdk.Keypair.fromSecret('SBP3BYOH4X3ZNAX72MUMIKF7HNFJVH7WPPNDFSLMNAU4KZD4WJJWG6D4');

const assetCode = 'XPAIO';

async function setHomeDomain() {
  try {
    console.log('--- [10단계] 홈 도메인 설정 및 검증 시작 ---');

    // STEP 1: 발행자(A지갑) 계정 로드
    // 도메인 설정은 '발행자' 계정의 권한입니다.
    const issuerAccount = await server.loadAccount(issuerKeys.publicKey());
    console.log('1. 발행자 계정 로드 성공:', issuerKeys.publicKey());

    // STEP 2: 홈 도메인 설정 트랜잭션 빌드 (중요 수정 부분)
    const domainTx = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE
    })
      .addOperation(StellarSdk.Operation.setOptions({
        homeDomain: "xpaio.com" // 파이 서버가 검증할 리더님의 도메인
      }))
      .setTimeout(30)
      .build();

    // STEP 3: 발행자 키로 서명 및 전송
    domainTx.sign(issuerKeys);
    const result = await server.submitTransaction(domainTx);

    console.log('2. 🎉 성공! 홈 도메인이 xpaio.com으로 연결되었습니다.');
    console.log('이제 파이 지갑이 이 토큰을 정식으로 인식합니다.');
    console.log('거래 내역 확인:', result._links.transaction.href);

  } catch (e) {
    // 상세 에러 확인을 위한 출력
    console.error('❌ 에러 발생:', e.response?.data?.extras?.result_codes || e);
  }
}

setHomeDomain();