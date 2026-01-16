const StellarSdk = require("@stellar/stellar-sdk");
const { Horizon, Keypair, TransactionBuilder, Operation } = StellarSdk.default || StellarSdk; 

// 1. 파이 테스트넷 서버 주소 설정
const server = new Horizon.Server("https://api.testnet.minepi.com"); 

// 2. 발행자(ISSUER)의 비밀키
const ISSUER_SECRET = "SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA"; 
const issuerKeypair = Keypair.fromSecret(ISSUER_SECRET);

async function setHomeDomain() {
  try {
    console.log("1. 발행자 계정 정보를 파이 네트워크에서 불러오는 중...");
    const account = await server.loadAccount(issuerKeypair.publicKey());

    // 최신 네트워크 수수료 정보 가져오기
    const ledgers = await server.ledgers().order("desc").limit(1).call();
    const currentFee = ledgers.records[0].base_fee_in_stroops;

    console.log("2. 홈 도메인(www.xpaio.com) 설정 트랜잭션 빌드 중...");
    const tx = new TransactionBuilder(account, {
      fee: currentFee, 
      // 💡 중요 수정: 파이 테스트넷 공식 식별자로 일치
      networkPassphrase: "Pi Network Testnet" 
    })
      .addOperation(
        Operation.setOptions({
          // ✅ 파이 개발자 포털 9단계에 적힌 주소와 100% 일치
          homeDomain: "www.xpaio.com" 
        })
      )
      .setTimeout(180) 
      .build();

    // 발행자 키로 서명
    tx.sign(issuerKeypair);

    const result = await server.submitTransaction(tx);
    console.log("\n✅ 10단계 준비 완료! 홈 도메인 설정 성공");
    console.log("🔗 트랜잭션 확인:", result._links.transaction.href);
    console.log("이제 파이 브라우저에서 'Verified Domain' 표시를 확인하실 수 있습니다.");

  } catch (err) {
    console.error("\n❌ 설정 실패:");
    if (err.response && err.response.data && err.response.data.extras) {
      console.error(JSON.stringify(err.response.data.extras.result_codes));
    } else {
      console.error(err.message);
    }
  }
}

setHomeDomain();