const StellarSdk = require('@stellar/stellar-sdk');
const SDK = StellarSdk.default || StellarSdk; // 최신 라이브러리 호환성 대응

// 1. 파이 테스트넷 네트워크 설정
const server = new SDK.Horizon.Server('https://api.testnet.minepi.com'); // 파이 전용 서버 주소
const NETWORK_PASSPHRASE = 'Pi Testnet';

// 2. 지갑 정보 (A = 발행자 GDMHO...)
const issuerKeys = SDK.Keypair.fromSecret('SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA'); 

async function setHomeDomain() {
  try {
    console.log('--- [10단계] 홈 도메인 설정 및 검증 시작 ---');

    // STEP 1: 발행자(A지갑) 계정 로드
    const issuerAccount = await server.loadAccount(issuerKeys.publicKey());
    console.log('1. 발행자 계정 로드 성공:', issuerKeys.publicKey());

    // STEP 2: 홈 도메인 설정 트랜잭션 빌드
    // [중요] 파이 개발자 포털과 100% 일치하도록 'www'를 포함합니다.
    const domainTx = new SDK.TransactionBuilder(issuerAccount, {
      fee: SDK.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE
    })
      .addOperation(SDK.Operation.setOptions({
        homeDomain: "www.xpaio.com" // 파이 시스템이 검증할 리더님의 정식 주소
      }))
      .setTimeout(180) // 네트워크 지연 대비 시간 연장
      .build();

    // STEP 3: 발행자 키로 서명 및 전송
    domainTx.sign(issuerKeys);
    const result = await server.submitTransaction(domainTx);

    console.log('\n2. 🎉 성공! 홈 도메인이 www.xpaio.com으로 연결되었습니다.');
    console.log('이제 파이 네트워크가 이 앱의 신원을 확인했습니다.');
    console.log('거래 내역 확인:', result._links.transaction.href);

  } catch (e) {
    console.error('\n❌ 에러 발생:');
    if (e.response && e.response.data && e.response.data.extras) {
      console.error(JSON.stringify(e.response.data.extras.result_codes));
    } else {
      console.error(e.message);
    }
  }
}

setHomeDomain();