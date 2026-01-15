const StellarSDK = require("@stellar/stellar-sdk");

// Pi Testnet Horizon URL 사용 (Pi Wallet 가이드 준수)
const server = new StellarSDK.Horizon.Server("https://api.testnet.minepi.com");
const NETWORK_PASSPHRASE = "Pi Testnet"; 

// ***************************************************************
// 🚨 [필수 입력] 아래 Secret Key 필드에 사용자의 키를 붙여넣으세요.
// ***************************************************************
// A2 발행자 시크릿 키 (Issuer)
const issuerSecret = "SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA"; // A2 SECRET KEY (이미지 참조)
// B2 유통자 시크릿 키 (Distributor)
const distributorSecret = "SBP3BYOH4X3ZNAX72MUMIKF7HNFJVH7WPPNDFSLMNAU4KZD4WJJWG6D4"; // B2 SECRET KEY (이미지 참조)
// ***************************************************************

const issuerKeypair = StellarSDK.Keypair.fromSecret(issuerSecret);
const distributorKeypair = StellarSDK.Keypair.fromSecret(distributorSecret);

// 1. XPAIO 토큰 정의 (코드: XPAIO, 발행자: A2 공개 키)
const customToken = new StellarSDK.Asset("XPAIO", issuerKeypair.publicKey());

async function runTokenSetup() {
    try {
        // Horizon API에서 최신 수수료 및 원장 정보를 가져옵니다.
        const response = await server.ledgers().order("desc").limit(1).call();
        const baseFee = response.records[0].base_fee_in_stroops;

        // ====================================================================================
        // 단계 1: B2 유통자 계정에 신뢰선 설정 (Change Trust)
        // ====================================================================================

        const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());

        const trustlineTransaction = new StellarSDK.TransactionBuilder(distributorAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(90),
        })
        .addOperation(StellarSDK.Operation.changeTrust({ asset: customToken, limit: undefined }))
        .setTimeout(180) 
        .build();

        trustlineTransaction.sign(distributorKeypair); // B2 시크릿 키로 서명

        await server.submitTransaction(trustlineTransaction);
        console.log("✅ Trustline created successfully for XPAIO on B2.");

        // ====================================================================================
        // 단계 2: A2 발행자 계정에서 B2 유통자 계정으로 토큰 발행 (Payment/Minting)
        // ====================================================================================

        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

        const paymentTransaction = new StellarSDK.TransactionBuilder(issuerAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(90),
        })
        .addOperation(
            StellarSDK.Operation.payment({
                destination: distributorKeypair.publicKey(),
                asset: customToken,
                amount: "50000000", // 5천만 개 발행
            })
        )
        .setTimeout(180) 
        .build();

        paymentTransaction.sign(issuerKeypair); // A2 시크릿 키로 서명

        await server.submitTransaction(paymentTransaction);
        console.log("✅ XPAIO Token issued successfully (50,000,000) to B2.");

        // 최종 잔액 확인 (B2 유통자 계정)
        const updatedDistributorAccount = await server.loadAccount(distributorKeypair.publicKey());
        const xpaioBalance = updatedDistributorAccount.balances.find(
            (balance) => balance.asset_code === "XPAIO"
        );
        console.log(`---`);
        console.log(`💰 B2 XPAIO Balance: ${xpaioBalance ? xpaioBalance.balance : 'Not found'}`);
        console.log(`✨ 토큰 발행 및 배포 완료!`);

    } catch (error) {
        console.error("❌ Token setup failed:", error);
    }
}

runTokenSetup();