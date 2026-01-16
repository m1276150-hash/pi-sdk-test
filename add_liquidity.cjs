const StellarSDK = require("@stellar/stellar-sdk");
const SDK = StellarSDK.default || StellarSDK;

const server = new SDK.Horizon.Server("https://api.testnet.minepi.com");
const NETWORK_PASSPHRASE = "Pi Network Testnet";

const distributorSecret = "SBP3BYOH4X3ZNAX72MUMIKF7HNFJVH7WPPNDFSLMNAU4KZD4WJJWG6D4";
const distributorKeypair = SDK.Keypair.fromSecret(distributorSecret);

async function addLiquidity() {
    try {
        console.log("🌊 XPAIO 유동성 공급 강제 실행 (수수료 보강)...");
        const account = await server.loadAccount(distributorKeypair.publicKey());

        const transaction = new SDK.TransactionBuilder(account, {
            // 💡 수수료를 1,000,000(1 Pi)으로 높여서 최우선 처리합니다.
            fee: "1000000", 
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(180)
        })
        .addOperation(SDK.Operation.liquidityPoolDeposit({
            liquidityPoolId: '6cc52f6762391696b9991206161405e3230a8c2215c2763f350ec2f47f2f116a',
            maxAmountA: "1000.0000000", 
            maxAmountB: "10.0000000",   
            minPrice: "0.0000001",
            maxPrice: "1000000",
        }))
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