const axios = require('axios');

// 확인하고 싶은 지갑 주소들 (G...)
const WALLETS = {
    "발행자(A)": "GDMHOZS5A6QZFI55WMGLZRAJMYUC5WEEMCEYY6JS5WVTTSGK4XLZQUVR",
    "유통자(B)": "GDPJPEV3OT7SE4NOXIEND7KWNKJ467PCIJMDEJUFMGLYIGTMW5AINZ2U",
    "개인 지갑": "GDDY4VDYKAIQ6SU2QQDJEBTMBMCUJW2NKW6Y46L6FFPYKQ5RWFG73EXK" // 여기에 개인 지갑 주소(G...)를 넣어주세요
};

async function checkWallets() {
    console.log('🔍 지갑 잔액 및 활성화 상태 점검 중...\n');
    
    for (const [name, addr] of Object.entries(WALLETS)) {
        if (!addr || addr.includes('입력')) continue;
        
        try {
            const res = await axios.get(`https://horizon-testnet.stellar.org/accounts/${addr}`);
            const balance = res.data.balances.find(b => b.asset_type === 'native').balance;
            console.log(`✅ [${name}] 상태: 활성`);
            console.log(`   💰 잔액: ${balance} Pi\n`);
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.log(`❌ [${name}] 상태: 미활성 (Not Found)`);
                console.log(`   ⚠️ 이 지갑은 현재 블록체인에 등록되어 있지 않습니다.\n`);
            } else {
                console.log(`❓ [${name}] 확인 실패: ${e.message}\n`);
            }
        }
    }
}

checkWallets();