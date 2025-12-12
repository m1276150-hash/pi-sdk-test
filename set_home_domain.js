// set_home_domain.js: 발행자 계정에 홈 도메인 설정

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

// ====================================================================
// 🚨 2. 발행자 키 설정 (A3 키 쌍)
const ISSUER_SECRET = 'SCQPXIZ2CJW55ZNNT45T6BXNAWZ35BYVCBMPSYQM6FI5LTWEKXKIE42I'; 
const issuerKeypair = Keypair.fromSecret(ISSUER_SECRET); 
const issuerPublicKey = issuerKeypair.publicKey(); 

// 🚨 3. 홈 도메인 설정 (Netlify 주소)
// 이 도메인에 /.well-known/pi.toml 파일이 호스팅되어야 합니다.
const HOME_DOMAIN = "xpaio.netlify.app"; 
// ====================================================================

async function setHomeDomain() {
    try {
        // 계정의 최신 시퀀스 번호를 로드합니다.
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
        const currentFee = (await server.ledgers().order("desc").limit(1).call()).records[0].base_fee_in_stroops;

        const setOptionsTransaction = new TransactionBuilder(issuerAccount, {
            fee: currentFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(90),
        })
        .addOperation(Operation.setOptions({ homeDomain: HOME_DOMAIN })) //
        .build();

        setOptionsTransaction.sign(issuerKeypair);
        await server.submitTransaction(setOptionsTransaction);

        console.log(`🎉 Home Domain [${HOME_DOMAIN}]이 발행자 계정에 성공적으로 설정되었습니다.`); //

    } catch (e) {
        console.error("❌ Home Domain 설정 실패:", e.message);
        if (e.response && e.response.data && e.response.data.extras) {
            console.error("트랜잭션 결과:", e.response.data.extras.result_codes);
        }
    }
}

setHomeDomain();