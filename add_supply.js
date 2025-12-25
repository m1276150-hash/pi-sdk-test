// XPAIO 토큰 추가 발행 코드 (49,000,000개)

const StellarSDK = require('@stellar/stellar-sdk');
const SDK = StellarSDK.default || StellarSDK;

const Server = SDK.Horizon.Server; 
const Keypair = SDK.Keypair; 
const Asset = SDK.Asset; 
const Operation = SDK.Operation; 
const TransactionBuilder = SDK.TransactionBuilder; 

// 🚨 1. 서버 및 네트워크 설정
const HORIZON_URL = "https://api.testnet.minepi.com"; 
const NETWORK_PASSPHRASE = "Pi Testnet"; 
const server = new Server(HORIZON_URL); 

// ====================================================================
// 🚨 2. 발행자 키 설정 (A3 키 쌍)
const issuerSecret = 'SCQPXIZ2CJW55ZNNT45T6BXNAWZ35BYVCBMPSYQM6FI5LTWEKXKIE42I'; 
const issuerKeypair = Keypair.fromSecret(issuerSecret); 
const issuerPublicKey = issuerKeypair.publicKey(); // GCSFHPO...

// 🚨 3. 수신자 계정 주소 설정 (B3 공개 키)
const receiverPublicKey = "GBGV5C7IOKG6HMW34D7QNSLLXT2UDBPNCKKMVDFCPWXGPZZMON63S7KW"; // B3 PUBLIC KEY
// ====================================================================

async function addSupply() {
    try {
        const response = await server.ledgers().order("desc").limit(1).call();
        const currentFee = response.records[0].base_fee_in_stroops;
        
        // XPAIO 토큰 정의 (발행자: A3 공개 키)
        const tokenAsset = new Asset("XPAIO", issuerPublicKey); 
        const issuerAccount = await server.loadAccount(issuerPublicKey);

        const transaction = new TransactionBuilder(issuerAccount, { 
            fee: currentFee, 
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(90), 
        })
            .addOperation(Operation.payment({ 
                destination: receiverPublicKey,
                asset: tokenAsset,
                amount: "49000000", 
            }))
            .build(); 

        transaction.sign(issuerKeypair);
        const result = await server.submitTransaction(transaction);

        console.log("🎉 XPAIO 토큰 49,000,000개 추가 발행 성공!");
        console.log("트랜잭션 해시:", result.hash);

    } catch (e) {
        console.error("❌ 토큰 추가 발행 실패:", e.message);
        if (e.response && e.response.data && e.response.data.extras) {
            console.error("트랜잭션 결과:", e.response.data.extras.result_codes);
        }
    }
}

addSupply();