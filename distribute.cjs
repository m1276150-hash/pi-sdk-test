const StellarSdk = require('@stellar/stellar-sdk');
const SDK = StellarSdk.default || StellarSdk;

// 1. 파이 테스트넷 서버 및 네트워크 설정
const server = new SDK.Horizon.Server('https://api.testnet.minepi.com'); 
// 💡 중요 수정: 파이 테스트넷 공식 식별자로 변경
const NETWORK_PASSPHRASE = "Pi Network Testnet"; 

// 2. 유통자(B지갑) 정보
const distributorSecret = 'SBP3BYOH4X3ZNAX72MUMIKF7HNFJVH7WPPNDFSLMNAU4KZD4WJJWG6D4';
const distributorKeypair = SDK.Keypair.fromSecret(distributorSecret);

// 3. 발행자(A지갑) 공개키 및 자산 정보
const issuerPublic = 'GDMHOZS5A6QZFI55WMGLZRAJMYUC5WEEMCEYY6JS5WVTTSGK4XLZQUVR';
const assetCode = 'XPAIO';
const xpaioAsset = new SDK.Asset(assetCode, issuerPublic);

// 4. 받을 사람들 목록
const receivers = [
  { name: '영복', address: 'GDAIHVIL5B2YAHIIAIJNW6WJ2VQDMXV2XPMOPT2HGC3QFGK3DAG5HR5J', amount: '1000' },
  { name: '내지갑', address: 'GDDY4VDYKAIQ6SU2QQDJEBTMBMCUJW2NKW6Y46L6FFPYKQ5RWFG73EXK', amount: '2000' },
  { name: '내사랑', address: 'GBM72BU4CMJ5QXJQIOYTNOBQGFPEGH4V3G36U7BRZM6HXOZ62LOMKPWI', amount: '3000' }
];

async function sendFromDistributor() {
  try {
    console.log('🚀 유통자(B지갑)에서 XPAIO 분배 시작');

    const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
    
    // 💡 수수료 최적화: 수동으로 계산하는 것보다 넉넉하게 설정하는 것이 안전합니다.
    const txBuilder = new SDK.TransactionBuilder(distributorAccount, {
      fee: "100000", // 0.1 Pi 수수료로 고정하여 전송 속도 보장
      networkPassphrase: NETWORK_PASSPHRASE,
    })
    .setTimeout(180); // timebounds를 간단하게 설정

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
        const codes = e.response.data.extras.result_codes;
        console.error("결과 코드:", JSON.stringify(codes));
        
        // 💡 팁: op_no_trust 에러가 나면 수신자가 XPAIO 트러스트라인을 설정 안 한 것입니다.
        if (codes.operations && codes.operations.includes("op_no_trust")) {
            console.error("📢 수신자 중 누군가 XPAIO 지갑을 활성화(트러스트라인 설정)하지 않았습니다.");
        }
    } else {
        console.error(e.message);
    }
  }
}

sendFromDistributor();