const StellarSdk = require("@stellar/stellar-sdk");
const { Horizon, Keypair, TransactionBuilder, Operation } = StellarSdk.default || StellarSdk; // 최신 라이브러리 호환성 대응

// 1. 파이 테스트넷 서버 주소 설정
const server = new Horizon.Server("https://api.testnet.minepi.com"); 

// 2. 발행자(ISSUER)의 비밀키 (GDMHO... 지갑의 열쇠)
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
      fee: currentFee, // 최신 수수료 자동 반영
      networkPassphrase: "Pi Testnet" 
    })
      // 핵심 오퍼레이션: 파이 개발자 포털과 100% 일치하게 설정
      .addOperation(
        Operation.setOptions({
          homeDomain: "www.xpaio.com" // www 포함 필수
        })
      )
      .setTimeout(180) // 시간 넉넉히 설정
      .build();

    // 발행자 키로 서명
    tx.sign(issuerKeypair);

    const result = await server.submitTransaction(tx);
    console.log("\n✅ 10단계 준비 완료! 홈 도메인 설정 성공");
    console.log("🔗 트랜잭션 확인:", result._links.transaction.href);

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