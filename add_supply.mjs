// Aibase 토큰 추가 발행 코드 (49,000,000개)
// 최신 Stellar SDK 호환 버전

const StellarSDK = require('stellar-sdk');

// 1. 서버 및 네트워크 설정
const server = new StellarSDK.Server('https://horizon.stellar.org');
const NETWORK_PASSPHRASE = StellarSDK.Networks.PUBLIC;
const baseFee = 100;

// 2. 발행자 시크릿 키 설정 (실제 키로 교체 필요!)
const issuerSecret = 'SACY7F7K3IA6SLWDK4UUVIEE4RIK6F6RHJZRNQSFPM24VUP2YXTSEQ5D';
const issuerKeypair = StellarSDK.Keypair.fromSecret(issuerSecret);
const issuerPublicKey = issuerKeypair.publicKey();

// 3. 수신자 계정 주소 설정
const receiverPublicKey = "GC4WMFQYM2PKZLU4KYKYVPRFJ2HWLTK3PWW22YKSRVBZAJMSK75TPAIF";

async function addSupply() {
    try {
        // 4. 자산 정의
        const aibaseAsset = new StellarSDK.Asset("aibase", issuerPublicKey);

        // 5. 발행자 계정 불러오기
        const issuerAccount = await server.loadAccount(issuerPublicKey);

        // 6. 트랜잭션 빌드
        const transaction = new StellarSDK.TransactionBuilder(issuerAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(StellarSDK.Operation.payment({
                destination: receiverPublicKey,
                asset: aibaseAsset,
                amount: "49000000.0000000", // 49,000,000개 추가 발행
            }))
            .setTimeout(90)
            .build();

        // 7. 서명 및 제출
        transaction.sign(issuerKeypair);
        const result = await server.submitTransaction(transaction);

        console.log("🎉 Aibase 49,000,000개 추가 발행 성공!");
        console.log("트랜잭션 해시:", result.hash);

    } catch (e) {
        console.error("추가 발행 실패:", e);
        if (e.response && e.response.data && e.response.data.extras) {
            console.error("트랜잭션 결과:", e.response.data.extras.result_codes);
        }
    }
}

// 8. 실행
addSupply().catch(error => {
    console.error("최상위 실행 오류:", error);
});