const { Horizon, Keypair, TransactionBuilder, Networks, Operation } = require("@stellar/stellar-sdk");

// 파이 테스트넷 서버 주소로 변경하는 것이 좋습니다.
const server = new Horizon.Server("https://api.testnet.minepi.com"); 

// 1. 발행자(ISSUER)의 비밀키를 입력하세요 (가장 중요!)
const ISSUER_SECRET = "SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA"; 
const issuerKeypair = Keypair.fromSecret(ISSUER_SECRET);

async function setHomeDomain() {
  try {
    console.log("1. 발행자 계정 정보를 불러오는 중...");
    const account = await server.loadAccount(issuerKeypair.publicKey());

    console.log("2. 홈 도메인(xpaio.com) 설정 트랜잭션 빌드 중...");
    const tx = new TransactionBuilder(account, {
      fee: "1000", // 수수료 넉넉히 설정
      networkPassphrase: "Pi Testnet" // 파이 네트워크용 패스프레이즈
    })
      // 핵심 오퍼레이션: 내 도메인을 블록체인에 등록합니다.
      .addOperation(
        Operation.setOptions({
          homeDomain: "xpaio.com" // 리더님의 도메인
        })
      )
      .setTimeout(60)
      .build();

    tx.sign(issuerKeypair);

    const result = await server.submitTransaction(tx);
    console.log("✅ 10단계 준비 완료! 홈 도메인 설정 성공:", result);

  } catch (err) {
    console.error("❌ 설정 실패:", err.response?.data?.extras?.result_codes || err);
  }
}

setHomeDomain();