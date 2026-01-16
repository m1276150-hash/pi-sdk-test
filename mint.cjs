const StellarSDK = require("@stellar/stellar-sdk");
const SDK = StellarSDK.default || StellarSDK;

const server = new SDK.Horizon.Server("https://api.testnet.minepi.com");
// 💡 중요 수정: 파이 테스트넷 공식 식별자 적용
const NETWORK_PASSPHRASE = "Pi Network Testnet"; 

// 리더님의 비밀키 정보
const issuerKeypair = SDK.Keypair.fromSecret("SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA");
const distributorKeypair = SDK.Keypair.fromSecret("SBP3BYOH4X3ZNAX72MUMIKF7HNFJVH7WPPNDFSLMNAU4KZD4WJJWG6D4");

const customToken = new SDK.Asset("XPAIO", issuerKeypair.publicKey());

async function runTokenSetup() {
    try {
        console.log("🚀 [XPAIO] 최종 발행 프로세스 시작...");
        
        // 💡 고정 수수료 설정: 테스트넷에서 가장 안정적인 값 사용
        const baseFee = "100000"; 

        // --- 단계 1: 유통자(B) 신뢰선 설정 확인 ---
        try {
            const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
            
            // 이미 신뢰선이 있는지 체크 로직 보강
            const hasTrust = distributorAccount.balances.some(b => b.asset_code === "XPAIO");
            
            if (!hasTrust) {
                console.log("⏳ 유통자 지갑에 XPAIO 신뢰선 설정 중...");
                const trustlineTx = new SDK.TransactionBuilder(distributorAccount, {
                    fee: baseFee,
                    networkPassphrase: NETWORK_PASSPHRASE,
                })
                .addOperation(SDK.Operation.changeTrust({ asset: customToken }))
                .setTimeout(180)
                .build();

                trustlineTx.sign(distributorKeypair);
                await server.submitTransaction(trustlineTx);
                console.log("✅ 유통자 지갑 신뢰선 설정 완료.");
            } else {
                console.log("✅ 신뢰선이 이미 설정되어 있습니다.");
            }
        } catch (e) {
            console.log("ℹ️ 계정 로드 실패 또는 설정 중 오류: " + e.message);
        }

        // --- 단계 2: 발행자(A)가 유통자(B)에게 전송 ---
        console.log("⏳ 단계 2: 발행자(A)로부터 5,000만 XPAIO 전송 중...");
        
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
        
        const paymentTx = new SDK.TransactionBuilder(issuerAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(SDK.Operation.payment({
            destination: distributorKeypair.publicKey(),
            asset: customToken,
            amount: "50000000" // stellar.toml의 fixed_number와 일치
        }))
        .setTimeout(180)
        .build();

        paymentTx.sign(issuerKeypair);
        
        const result = await server.submitTransaction(paymentTx);
        console.log("🎉 [대성공] XPAIO 토큰 5,000만 개 발행 및 전송 완료!");
        console.log("🔗 트랜잭션 주소: " + result._links.transaction.href);

    } catch (error) {
        console.error("❌ 오류 발생 상세 내역:");
        if (error.response?.data?.extras?.result_codes) {
            console.error("결과 코드:", JSON.stringify(error.response.data.extras.result_codes));
        } else {
            console.error("메시지:", error.message);
        }
    }
}

runTokenSetup();