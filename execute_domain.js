// --- [중요] 여기에 2개의 '비밀키(Seed)'를 입력하세요 ---
// (절대 이 파일을 타인에게 유출하지 마세요)

const ISSUER_SECRET_KEY = 'SDFHOFGMEYV7GSYKDRZG7DA5RZ4JN65IEQHPFBGEWVZQB5IA6VOBYAID'; // 🏭 A2 발행자 비밀키 (새로운 키)
const DISTRIBUTOR_SECRET_KEY = 'SAQTYQTDGRFUFLCCYTE7BVBY53LNGBCDWMTWANASRZXRRVG7SFNIDWUC'; // 🏦 B2 유통자 비밀키 (새로운 키)

// --- [설정] Xpaio 토큰 정보 ---
const ISSUER_PUBLIC_KEY = 'GB6LCMDPCH7AE4WGCDUC76IQOUYIJ44QA5EZH2J7I5KWRHWCLNRRTFKP'; // 🏭 A2 발행자 공개키 (새로운 키)
const DISTRIBUTOR_PUBLIC_KEY = 'GCWTSUCW7OMVH66DYCI26GGC33U5ZH5MZVBFRH2YY7ZW3NUPZBKABDPB'; // 🏦 B2 유통자 공개키 (새로운 키)

// ----------------------------------------------------------------------------------
// ⭐ XPAIO 프로젝트 최종 설정
// ----------------------------------------------------------------------------------
const TOKEN_CODE = 'XPAIO'; // XPAIO 토큰 코드 (최종 확정)
const TOKEN_AMOUNT = '50000000'; // 토큰 발행량 5천만 개
const HOME_DOMAIN = 'xpaio.com'; // Pi Wallet에 등록할 공식 도메인

// -----------------------------------------------------------------
// (아래 코드는 수정하지 마세요)
// -----------------------------------------------------------------

const StellarSdk = require('@stellar/stellar-sdk');

// Pi 테스트넷 서버 설정 (공식 문서 기준)
const server = new StellarSdk.Horizon.Server('https://api.testnet.minepi.com');
const networkPassphrase = 'Pi Testnet';

// 두 지갑의 키 쌍 준비
const issuerKeys = StellarSdk.Keypair.fromSecret(ISSUER_SECRET_KEY);
const distributorKeys = StellarSdk.Keypair.fromSecret(DISTRIBUTOR_SECRET_KEY);

// 발행할 토큰 정의
const spotToken = new StellarSdk.Asset(TOKEN_CODE, issuerKeys.publicKey());

/**
 * 디버깅: 계정 정보 확인
 */
async function checkAccount(publicKey, accountName) {
  try {
    console.log(`\n[디버깅] ${accountName} 계정 확인 중...`);
    console.log(`  공개키: ${publicKey}`);

    const account = await server.loadAccount(publicKey);
    console.log(`  ✅ 계정 존재 확인됨`);
    console.log(`  시퀀스 번호: ${account.sequenceNumber()}`);

    // 잔액 확인
    const balances = account.balances || [];
    console.log(`  잔액 정보:`);
    balances.forEach((balance) => {
      if (balance.asset_type === 'native') {
        console.log(`    - Test-Pi: ${balance.balance} XLM`);
      } else {
        console.log(
          `    - ${balance.asset_code}: ${
            balance.balance
          } (발행자: ${balance.asset_issuer?.substring(0, 8)}...)`
        );
      }
    });

    // 최소 잔액 확인 (수수료용)
    const nativeBalance = balances.find((b) => b.asset_type === 'native');
    if (nativeBalance && parseFloat(nativeBalance.balance) < 1) {
      console.log(
        `  ⚠️  경고: Test-Pi 잔액이 부족할 수 있습니다 (현재: ${nativeBalance.balance})`
      );
    }

    return account;
  } catch (error) {
    console.error(`\n[디버깅] 계정 로드 중 에러 발생:`);
    console.error(`  에러 메시지: ${error.message}`);
    if (error.response?.status === 404) {
      console.error(
        `  ❌ 계정이 존재하지 않습니다. Pi Wallet에서 계정을 활성화했는지 확인하세요.`
      );
    }
    throw error;
  }
}

/**
 * 절차 1: '금고'가 '공장'을 신뢰하도록 설정합니다.
 * (수행 주체: 유통 계정 / '금고')
 */
async function setupTrustline() {
  console.log('\n' + '='.repeat(60));
  console.log(`--- 1단계: '${TOKEN_CODE}' 신뢰선 설정 시작 ---`);
  console.log('='.repeat(60));
  try {
    console.log('\n[디버깅] 유통자 계정 로드 중...');
    const distributorAccount = await server.loadAccount(
      distributorKeys.publicKey()
    );
    
    // 이미 신뢰선이 있는지 확인
    const existingTrustline = distributorAccount.balances.find(
      (b) =>
        b.asset_type !== 'native' &&
        b.asset_code === TOKEN_CODE &&
        b.asset_issuer === issuerKeys.publicKey()
    );
    if (existingTrustline) {
      console.log(`  ⚠️  이미 신뢰선이 존재합니다. 1단계는 건너뛰고 2단계로 진행합니다.`);
      return true; // 이미 성공한 것으로 간주
    }
    
    // 최신 ledger에서 base fee 가져오기
    const response = await server.ledgers().order('desc').limit(1).call();
    const latestBlock = response.records[0];
    const baseFee = latestBlock.base_fee_in_stroops;

    // Timebounds 가져오기
    const timebounds = await server.fetchTimebounds(90);

    console.log('\n[디버깅] 트랜잭션 빌드 중...');
    const transaction = new StellarSdk.TransactionBuilder(distributorAccount, {
      fee: baseFee,
      networkPassphrase: networkPassphrase,
      timebounds: timebounds,
    })
      // '금고'가 토큰을 받겠다고 '신뢰(Trust)'함
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: spotToken,
          limit: undefined,
        })
      )
      .build();

    console.log(`  트랜잭션 해시: ${transaction.hash().toString('hex')}`);

    // '금고'의 비밀키로 서명
    transaction.sign(distributorKeys);
    console.log('  ✅ 서명 완료');

    console.log('\n[디버깅] 트랜잭션 전송 중...');
    const result = await server.submitTransaction(transaction);
    console.log('\n✅ 1단계 성공! 신뢰선 설정 완료');
    console.log(`  트랜잭션 링크: ${result._links.transaction.href}`);
    return true;
  } catch (error) {
    console.error('\n❌ 1단계 실패:');
    // 오류 디버깅 정보 출력 (축소)
    if (error.response?.data?.extras?.result_codes) {
        console.error('트랜잭션 결과 코드:', error.response.data.extras.result_codes);
    } else {
        console.error('에러 메시지:', error.message);
    }
    console.error('='.repeat(60));
    return false;
  }
}

/**
 * 절차 2: '공장'이 토큰을 발행하고, 즉시 스스로를 잠급니다.
 * (수행 주체: 발행 계정 / '공장')
 */
async function issueAndLock() {
  console.log('\n' + '='.repeat(60));
  console.log("--- 2단계: '공장' 발행 및 잠금 시작 ---");
  console.log('='.repeat(60));
  try {
    console.log('\n[디버깅] 발행자 계정 로드 중...');
    const issuerServer = new StellarSdk.Horizon.Server(
      'https://api.testnet.minepi.com'
    );
    const issuerAccount = await issuerServer.loadAccount(
      issuerKeys.publicKey()
    );
    
    // 금고 계정이 신뢰선을 설정했는지 최종 확인 (선택 사항)
    console.log('\n[디버깅] 금고 계정 신뢰선 확인 중...');
    const distributorAccount = await issuerServer.loadAccount(
      distributorKeys.publicKey()
    );
    const hasTrustline = distributorAccount.balances.some(
      (b) =>
        b.asset_type !== 'native' &&
        b.asset_code === TOKEN_CODE &&
        b.asset_issuer === issuerKeys.publicKey()
    );
    if (!hasTrustline) {
      throw new Error(
        '금고 계정에 신뢰선이 설정되지 않았습니다. 1단계를 먼저 완료하세요.'
      );
    }
    console.log('  ✅ 신뢰선 확인됨');


    // 최신 ledger에서 base fee, Timebounds 가져오기
    const response = await issuerServer.ledgers().order('desc').limit(1).call();
    const latestBlock = response.records[0];
    const baseFee = latestBlock.base_fee_in_stroops;
    const timebounds = await issuerServer.fetchTimebounds(90);

    // 발행 정보 확인
    console.log('\n[디버깅] 발행 정보:');
    console.log(`  발행량: ${TOKEN_AMOUNT} ${TOKEN_CODE}`);
    console.log(`  Home Domain 설정: ${HOME_DOMAIN}`);


    console.log('\n[디버깅] 트랜잭션 빌드 중...');
    const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee: baseFee,
      networkPassphrase: networkPassphrase,
      timebounds: timebounds,
    })
      // 1. 토큰을 '금고'로 발행(전송)
      .addOperation(
        StellarSdk.Operation.payment({
          destination: distributorKeys.publicKey(),
          asset: spotToken,
          amount: TOKEN_AMOUNT,
        })
      )
      // 2. '공장' 계정을 영구적으로 잠금 (추가 발행 절대 불가) 및 Home Domain 설정
      .addOperation(
        StellarSdk.Operation.setOptions({
          masterWeight: 0, // 마스터 가중치를 0으로 설정하여 잠금
          homeDomain: HOME_DOMAIN,
        })
      )
      .build();

    console.log(`  트랜잭션 해시: ${transaction.hash().toString('hex')}`);

    // '공장'의 비밀키로 서명
    console.log('\n[디버깅] 트랜잭션 서명 중...');
    transaction.sign(issuerKeys);
    console.log('  ✅ 서명 완료');

    console.log('\n[디버깅] 트랜잭션 전송 중...');
    const result = await issuerServer.submitTransaction(transaction);
    console.log('\n🎉 2단계 성공! 발행 및 잠금 완료');
    console.log(`  트랜잭션 링크: ${result._links.transaction.href}`);
    console.log(
      `\n'${distributorKeys.publicKey()}' (금고) 지갑에 ${TOKEN_AMOUNT} ${TOKEN_CODE}가 전송되었습니다.`
    );
    console.log(
      `'${issuerKeys.publicKey()}' (공장) 지갑은 영구적으로 잠겼습니다.`
    );
  } catch (error) {
    console.error('\n❌ 2단계 실패:');
    // 오류 디버깅 정보 출력 (축소)
    if (error.response?.data?.extras?.result_codes) {
        console.error('트랜잭션 결과 코드:', error.response.data.extras.result_codes);
    } else {
        console.error('에러 메시지:', error.message);
    }
    console.error('='.repeat(60));
    return false;
  }
}

/**
 * 스크립트 실행
 */
async function run() {
  try {
    // 발행 전에 키 쌍 일치 여부와 네트워크 연결을 확인합니다.
    // checkAccount(issuerKeys.publicKey(), '발행자 (공장)');
    // checkAccount(distributorKeys.publicKey(), '유통자 (금고)');
    
    // validateSetup(); 함수는 제거하고 핵심 트랜잭션에 집중합니다.

    const trustlineSuccess = await setupTrustline();

    if (trustlineSuccess) {
      // 1단계(신뢰선)가 성공해야만 2단계를 실행합니다.
      await issueAndLock();

      console.log('\n' + '='.repeat(60));
      console.log('✅ Xpaio 토큰 재발행 및 잠금 완료!');
      console.log('='.repeat(60));
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('1단계 신뢰선 설정에 실패하여 2단계를 진행하지 않습니다.');
      console.log('='.repeat(60));
    }
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ 치명적 오류 발생:');
    console.error(error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

run();