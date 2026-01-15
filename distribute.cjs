const StellarSdk = require('@stellar/stellar-sdk');

const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
StellarSdk.Network.useTestNetwork();

// 유통자(B지갑)
const distributorSecret = 'SBP3BYOH4X3ZNAX72MUMIKF7HNFJVH7WPPNDFSLMNAU4KZD4WJJWG6D4';
const distributorKeypair = StellarSdk.Keypair.fromSecret(distributorSecret);

// 발행자(A지갑) 공개키
const issuerPublic = 'GDMHOZS5A6QZFI55WMGLZRAJMYUC5WEEMCEYY6JS5WVTTSGK4XLZQUVR';

// 자산 정보
const assetCode = 'XPAIO';

// 받을 사람들 목록
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

    const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());

    const txBuilder = new StellarSdk.TransactionBuilder(distributorAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    });

    receivers.forEach(r => {
      console.log(`→ ${r.name} 에게 ${r.amount} XPAIO 전송 준비`);
      txBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination: r.address,
          asset: new StellarSdk.Asset(assetCode, issuerPublic),
          amount: r.amount
        })
      );
    });

    const tx = txBuilder.setTimeout(60).build();
    tx.sign(distributorKeypair);

    const result = await server.submitTransaction(tx);

    console.log('🎉 전송 성공!');
    console.log(JSON.stringify(result, null, 2));

  } catch (e) {
    console.error('❌ 전송 실패:', e.response?.data || e);
  }
}

sendFromDistributor();