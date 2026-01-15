const StellarSDK = require("@stellar/stellar-sdk");
const SDK = StellarSDK.default || StellarSDK; // 최신 라이브러리 호환성 대응

// 1. 파이 테스트넷 서버 설정 (Pi Wallet 가이드 준수)
const server = new SDK.Horizon.Server("https://api.testnet.minepi.com");
const NETWORK_PASSPHRASE = "Pi Testnet"; 

// 2. 지갑 정보 (A=발행자, B=유통자)
const issuerSecret = "SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA"; 
const distributorSecret = "SBP3BYOH4X3ZNAX72MUMIKF7HNFJVH7WPPNDFSLMNAU4KZD4WJJWG6D4"; 

const issuerKeypair = SDK.Keypair.fromSecret(issuerSecret);
const distributorKeypair = SDK.Keypair.fromSecret(distributorSecret);

// 3. XPAIO 토큰 정의 (발행자 A의 공개키와 결합)
const customToken = new SDK.Asset("XPAIO", issuerKeypair.publicKey());

async function runTokenSetup() {
    try {
        console.log("🚀 XPAIO 토큰 발행 및 유통 준비 시작...");

        // 최신 네트워크 수수료 정보 가져오기
        const response = await server.ledgers().order("desc").limit(1).call();
        const baseFee = response.records[0].base_fee_in_stroops;

        // ====================================================================================
        // 단계 1: B유통자 계정에 신뢰선 설정 (Change Trust)
        // B지갑이 XPAIO를 받을 수 있도록 허용하는 과정입니다.
        // ====================================================================================
        console.log("⏳ 단계 1: 유통자(B) 계정에 XPAIO 신뢰선 설정 중...");
        const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());

        const trustlineTransaction = new SDK.TransactionBuilder(distributorAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(180),
        })
        .addOperation(SDK.Operation.changeTrust({ asset: customToken })) 
        .setTimeout(180) 
        .build();

        trustlineTransaction.sign(distributorKeypair); 
        await server.submitTransaction(trustlineTransaction);
        console.log("✅ 성공: 유통자(B) 지갑이 XPAIO 토큰을 받을 준비가 되었습니다.");

        // ====================================================================================
        // 단계 2: A발행자 계정에서 B유통자 계정으로 토큰 발행 (Minting)
        // ====================================================================================
        console.log("⏳ 단계 2: 발행자(A)로부터 50,000,000 XPAIO 발행 중...");
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

        const paymentTransaction = new SDK.TransactionBuilder(issuerAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(180),
        })
        .addOperation(
            SDK.Operation.payment({
                destination: distributorKeypair.publicKey(),
                asset: customToken,
                amount: "50000000", // 5,000만 개 발행
            })
        )
        .setTimeout(180) 
        .build();

        paymentTransaction.sign(issuerKeypair); 

        await server.submitTransaction(paymentTransaction);
        console.log("✅ 성공: 50,000,000 XPAIO가 유통자(B) 지갑으로 발행되었습니다.");

        // 최종 잔액 확인
        const updatedDistributor = await server.loadAccount(distributorKeypair.publicKey());
        const xpaioBalance = updatedDistributor.balances.find(b => b.asset_code === "XPAIO");
        
        console.log(`---`);
        console.log(`💰 최종 확인 - 유통자(B) XPAIO 잔액: ${xpaioBalance ? xpaioBalance.balance : '0'}`);
        console.log(`✨ 모든 토큰 발행 절차가 완료되었습니다!`);

    } catch (error) {
        console.error("❌ 토큰 발행 실패:");
        if (error.response && error.response.data && error.response.data.extras) {
            console.error(JSON.stringify(error.response.data.extras.result_codes));
        } else {
            console.error(error.message);
        }
    }
}

runTokenSetup();