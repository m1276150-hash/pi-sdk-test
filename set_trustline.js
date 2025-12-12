// Trustline 설정 스크립트: B 계정이 A3 발행 XPAIO 토큰을 받을 수 있도록 신뢰선 설정

const StellarSDK = require('@stellar/stellar-sdk');
const SDK = StellarSDK.default || StellarSDK;

const Server = SDK.Horizon.Server; 
const Keypair = SDK.Keypair; 
const Operation = SDK.Operation; 
const TransactionBuilder = SDK.TransactionBuilder; 

// 🚨 1. 서버 및 네트워크 설정
const HORIZON_URL = "https://api.testnet.minepi.com"; 
const NETWORK_PASSPHRASE = "Pi Testnet"; 
const server = new Server(HORIZON_URL); 

// 🚨 2. 토큰 발행자 키 (A3_PUBLIC_KEY - 토큰이 어디서 오는지 정의)
const ISSUER_PUBLIC_KEY = "GCSFHPOHQKWEDUW2YQ3YNVROWHYBGGPVWAZN6CWMLDTVVSLAEBHMF3JG"; 
const ASSET_CODE = "XPAIO";

// 🚨 3. 신뢰선을 설정할 계정 (B3_SECRET_KEY - 토큰을 받을 계정)
const DISTRIBUTOR_SECRET = "SAFCGPAIWQVXOO2QFK2GIJAFD7MEP4NHRKQ3GGAOAXLQGUTTMIZG2AYV"; 
const distributorKeypair = Keypair.fromSecret(DISTRIBUTOR_SECRET);
const distributorPublicKey = distributorKeypair.publicKey();

// 🚨 4. XPAIO 토큰 정의
const customAsset = new SDK.Asset(ASSET_CODE, ISSUER_PUBLIC_KEY);

async function setTrustline() {
    try {
        const distributorAccount = await server.loadAccount(distributorPublicKey);
        const currentFee = (await server.ledgers().order("desc").limit(1).call()).records[0].base_fee_in_stroops;

        const transaction = new TransactionBuilder(distributorAccount, { 
            fee: currentFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(90),
        })
        .addOperation(Operation.changeTrust({ 
            asset: customAsset, 
            limit: undefined 
        }))
        .build();

        transaction.sign(distributorKeypair); 
        await server.submitTransaction(transaction);

        console.log("🎉 신뢰선 설정 성공!");
        console.log(`✅ 유통자 계정 (${distributorPublicKey.substring(0,4)}...)이 XPAIO 토큰을 받을 준비를 마쳤습니다.`);

    } catch (e) {
        console.error("❌ 신뢰선 설정 실패:", e.message);
        if (e.response && e.response.data && e.response.data.extras) {
            console.error("트랜잭션 결과:", e.response.data.extras.result_codes);
        }
    }
}

setTrustline();