const StellarSDK = require("@stellar/stellar-sdk");
const SDK = StellarSDK.default || StellarSDK;

const server = new SDK.Horizon.Server("https://api.testnet.minepi.com");
const NETWORK_PASSPHRASE = "Pi Network Testnet"; 

// 리더님이 주신 정보로 정확히 세팅
const issuerKeypair = SDK.Keypair.fromSecret("SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA");
const distributorKeypair = SDK.Keypair.fromSecret("SBP3BYOH4X3ZNAX72MUMIKF7HNFJVH7WPPNDFSLMNAU4KZD4WJJWG6D4");

const customToken = new SDK.Asset("XPAIO", issuerKeypair.publicKey());

async function runTokenSetup() {
    try {
        console.log("🚀 [XPAIO] 최종 발행 프로세스 시작...");
        
        // 최신 수수료 및 네트워크 상태 확인
        const feeStats = await server.feeStats();
        const baseFee = feeStats.max_fee.mode || 10000;

        // --- 단계 1: 유통자(B) 신뢰선 (이미 되어있을 확률 높음) ---
        try {
            const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
            const trustlineTx = new SDK.TransactionBuilder(distributorAccount, {
                fee: baseFee,
                networkPassphrase: NETWORK_PASSPHRASE,
                timebounds: await server.fetchTimebounds(60)
            })
            .addOperation(SDK.Operation.changeTrust({ asset: customToken }))
            .build();

            trustlineTx.sign(distributorKeypair);
            await server.submitTransaction(trustlineTx);
            console.log("✅ 유통자 지갑 신뢰선 확인 완료.");
        } catch (e) {
            console.log("ℹ️ 신뢰선이 이미 설정되어 있어 다음 단계로 넘어갑니다.");
        }

        // --- 단계 2: 발행자(A)가 유통자(B)에게 전송 ---
        console.log("⏳ 단계 2: 발행자(A)로부터 5,000만 XPAIO 전송 중...");
        
        // ⚠️ 중요: 발행자 계정 정보를 실시간으로 다시 로드하여 인증 오류 방지
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
        
        const paymentTx = new SDK.TransactionBuilder(issuerAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(100)
        })
        .addOperation(SDK.Operation.payment({
            destination: distributorKeypair.publicKey(),
            asset: customToken,
            amount: "50000000"
        }))
        .build();

        // 발행자 지갑(SAR...)으로 직접 서명
        paymentTx.sign(issuerKeypair);
        
        const result = await server.submitTransaction(paymentTx);
        console.log("🎉 [대성공] XPAIO 토큰 5,000만 개 발행 완료!");
        console.log("🔗 트랜잭션 주소: " + result._links.transaction.href);

    } catch (error) {
        console.error("❌ 오류 발생 상세 내역:");
        if (error.response && error.response.data && error.response.data.extras) {
            console.error("결과 코드:", JSON.stringify(error.response.data.extras.result_codes));
        } else {
            console.error("메시지:", error.message);
        }
    }
}

runTokenSetup();