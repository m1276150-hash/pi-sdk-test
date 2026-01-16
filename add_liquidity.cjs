const StellarSDK = require("@stellar/stellar-sdk");
const SDK = StellarSDK.default || StellarSDK;

const server = new SDK.Horizon.Server("https://api.testnet.minepi.com");
const NETWORK_PASSPHRASE = "Pi Network Testnet";

const distributorSecret = "SBP3BYOH4X3ZNAX72MUMIKF7HNFJVH7WPPNDFSLMNAU4KZD4WJJWG6D4";
const distributorKeypair = SDK.Keypair.fromSecret(distributorSecret);

// 💡 자산 정의 추가
const XPAIO = new SDK.Asset("XPAIO", "GDMHOZS5A6QZFI55WMGLZRAJMYUC5WEEMCEYY6JS5WVTTSGK4XLZQUVR");
const NativePi = SDK.Asset.native();

async function addLiquidity() {
    try {
        console.log("🌊 XPAIO 유동성 공급 강제 실행 (수수료 및 자산 자동 계산)...");
        const account = await server.loadAccount(distributorKeypair.publicKey());

        // 💡 풀 ID 자동 계산 방식 권장
        const lpAsset = SDK.LiquidityPoolAsset.fromAssetPair(XPAIO, NativePi);

        const transaction = new SDK.TransactionBuilder(account, {
            fee: "1000000", 
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(SDK.Operation.liquidityPoolDeposit({
            liquidityPoolId: lpAsset.getLiquidityPoolId(), // 자동 계산된 ID 사용
            maxAmountA: "1000.0000000", 
            maxAmountB: "10.0000000",   
            minPrice: "0.0000001",
            maxPrice: "1000000",
        }))
        .setTimeout(180) // fetchTimebounds 대신 간단한 타임아웃 권장
        .build();

        transaction.sign(distributorKeypair);
        const result = await server.submitTransaction(transaction);
        
        console.log("✅ [최종 성공] 유동성 공급 완료!");
        console.log("🔗 트랜잭션 주소: " + result._links.transaction.href);
        console.log("\n💡 이제 지갑에서 N/A가 사라지고 숫자가 보일 것입니다!");

    } catch (error) {
        console.error("❌ 실패 상세:");
        if (error.response?.data?.extras?.result_codes) {
            console.error(JSON.stringify(error.response.data.extras.result_codes));
        } else {
            console.error(error.message);
        }
    }
}

addLiquidity();