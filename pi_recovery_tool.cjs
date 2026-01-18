async function clearIncompletePayments() {
    console.log("🚀 XPAIO 보안 통로 청소를 시작합니다...");
    try {
        // SDK 응답에서 미완료 결제 배열을 정확히 추출합니다.
        const response = await pi.getIncompleteServerPayments();
        
        // 응답이 배열이면 그대로 쓰고, 객체 안에 담겨 있으면 해당 배열을 꺼냅니다.
        const incompletePayments = Array.isArray(response) ? response : (response.incomplete_server_payments || []);
        
        if (incompletePayments.length === 0) {
            console.log("✅ 정체된 결제가 없습니다. 이제 샌드박스 코드를 입력하면 바로 연결될 것입니다.");
            return;
        }

        console.log(`⚠️ ${incompletePayments.length}개의 미완료 결제를 발견했습니다. 삭제를 시작합니다.`);

        for (const payment of incompletePayments) {
            if (payment && payment.identifier) {
                console.log(`- 정리 중인 ID: ${payment.identifier}`);
                await pi.cancelPayment(payment.identifier);
            }
        }

        console.log("🎯 청소 완료! 이제 파이 브라우저에서 샌드박스 인증을 다시 시도하세요.");
    } catch (error) {
        console.error("❌ 오류 발생:", error.message);
        // 에러가 발생했다면 상세 내용을 확인합니다.
        if (error.response && error.response.data) {
            console.error("상세 에러:", error.response.data);
        }
    }
}