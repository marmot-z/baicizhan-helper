;(function(window, document, $) {
    'use strict';

    const apiModule = window.apiModule;
    const POLLING_INTERVAL = 2000; // 轮询间隔：2秒
    const MAX_POLLING_TIME = 10 * 60 * 1000; // 最大轮询时间：10分钟
    let pollingTimer = null;
    let startTime = null;

    function getOrderNo() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('orderNo');
    }

    function closeWindow() {
        window.close();
    }

    function showError(message) {
        $('#paymentContent').html(`
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        `);
    }

    function showQrCode(qrCodeUrl) {
        $('#paymentContent').html(`
            <div class="text-center">
                <img src="${qrCodeUrl}" class="img-fluid" alt="支付二维码">
                <p class="mt-3">请使用微信扫码支付</p>
            </div>
        `);
    }

    function checkOrderState() {
        if (Date.now() - startTime >= MAX_POLLING_TIME) {
            clearInterval(pollingTimer);
            showError('订单超时未支付');
            return;
        }

        apiModule.getOrderState(getOrderNo())
            .then(state => {
                if (state === 2) {
                    clearInterval(pollingTimer);
                    alert('支付成功');
                    closeWindow();
                } else if (state === 1) {
                    clearInterval(pollingTimer);
                    showError('订单超时未支付');
                }
            })
            .catch(err => {                                
                console.error(err);
                window.Analytics.fireErrorEvent(err, { message: `获取订单状态失败` });
            });
    }

    async function initWxpayQrCode() {
        const orderNo = getOrderNo();
        if (!orderNo) {
            showError('订单号为空');
            setTimeout(closeWindow, 2000);
            return;
        }

        try {
            const payInfo = await apiModule.generateWxpayQrCode(orderNo);

            if (!payInfo || payInfo.code !== 0) {
                showError('发起微信支付失败，请稍候重试');
                return;
            }

            showQrCode(payInfo.data.qrcode_url);
            
            startTime = Date.now();
            pollingTimer = setInterval(checkOrderState, POLLING_INTERVAL);
        } catch (err) {
            showError(err.message || '发起微信支付失败，请稍候重试');
            window.Analytics.fireErrorEvent(err, { message: `发起微信支付失败` });
        }
    }

    async function init() {
        window.Analytics.firePageViewEvent('pay', 'pay.html');
        initWxpayQrCode();
    }

    window.onload = init;
})(this, document, jQuery);