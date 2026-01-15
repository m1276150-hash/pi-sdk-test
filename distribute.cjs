const StellarSdk = require('@stellar/stellar-sdk');
const SDK = StellarSdk.default || StellarSdk; // 최신 라이브러리 호환성 대응

// 1. 파이 테스트넷 서버 및 네트워크 설정
const server = new SDK.Horizon.Server('https://api.testnet.minepi.com'); // 파이 전용 API 주소로 수정
const NETWORK_PASSPHRASE = "Pi Testnet"; // 파이 네트워크 식별자

// 2. 유통자(B지갑) 정보
const distributorSecret = 'SBP3BYOH4X3ZNAX72MUMIKF7HNFJVH7WPPNDFSLMNAU4KZD4WJJWG6D4';
const distributorKeypair = SDK.Keypair.fromSecret(distributorSecret);

// 3. 발행자(A지갑) 공개키 및 자산 정보
const issuerPublic = 'GDMHOZS5A6QZFI55WMGLZRAJMYUC5WEEMCEYY6JS5WVTTSGK4XLZQUVR';
const assetCode = 'XPAIO';
const xpaioAsset = new SDK.Asset(assetCode, issuerPublic);

// 4. 받을 사람들 목록 (영복 님 등)
const receivers = [
  {
    name: '영복',
    address: 'GDAIHVIL5B2YAHIIAIJNW6WJ2VQDMXV2XPMOPT2HGC3QFGK3DAG5HR5J',
    amount: '1000'
  },
  {
    name: '내지갑',
    address: 'GDDY4VDYKAIQ6SU2QQDJEBTMBMCUJW2NKW6Y46L6FFPYKQ5RWFG73EXK',
    amount: '2000'
  },
  {
    name: '내사랑',
    address: 'GBM72BU4CMJ5QXJQIOYTNOBQGFPEGH4V3G36U7BRZM6HXOZ62LOMKPWI',
    amount: '3000'
  }
];

async function sendFromDistributor() {
  try {
    console.log('🚀 유통자(B지갑)에서 XPAIO 분배 시작');

    // 최신 계정 정보 및 수수료 로드
    const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
    const ledgers = await server.ledgers().order("desc").limit(1).call();
    const currentFee = ledgers.records[0].base_fee_in_stroops;

    const txBuilder = new SDK.TransactionBuilder(distributorAccount, {
      fee: currentFee,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: await server.fetchTimebounds(180) // 유효 시간 설정
    });

    receivers.forEach(r => {
      console.log(`→ ${r.name} 에게 ${r.amount} XPAIO 전송 준비`);
      txBuilder.addOperation(
        SDK.Operation.payment({
          destination: r.address,
          asset: xpaioAsset,
          amount: r.amount
        })
      );
    });

    const tx = txBuilder.build();
    tx.sign(distributorKeypair);

    const result = await server.submitTransaction(tx);

    console.log('\n🎉 전송 성공!');
    console.log(`🔗 확인 링크: ${result._links.transaction.href}`);

  } catch (e) {
    console.error('\n❌ 전송 실패:');
    if (e.response && e.response.data && e.response.data.extras) {
        // 수신자가 지갑을 안 열었을 때(op_no_trust) 확인용
        console.error("결과 코드:", JSON.stringify(e.response.data.extras.result_codes));
    } else {
        console.error(e.message);
    }
  }
}

sendFromDistributor();