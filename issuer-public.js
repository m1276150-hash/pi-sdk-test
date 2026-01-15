const StellarSdk = require('@stellar/stellar-sdk');
const SDK = StellarSdk.default || StellarSdk; // 최신 라이브러리 호환성 대응

// 리더님의 실제 발행자 비밀키
const issuerSecret = 'SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA';

try {
    const issuerKeypair = SDK.Keypair.fromSecret(issuerSecret);
    
    console.log('================================================');
    console.log('🛡️  XPAIO 발행자(Issuer) 정보 확인');
    console.log('================================================');
    console.log('✅ 공개키 (Public Key):', issuerKeypair.publicKey());
    console.log('------------------------------------------------');
    console.log('※ 이 공개키는 p.toml 및 모든 전송 코드의');
    console.log('   issuer 주소와 정확히 일치해야 합니다.');
    console.log('================================================');

} catch (error) {
    console.error('❌ 에러 발생: 비밀키 형식이 올바르지 않습니다.', error.message);
}