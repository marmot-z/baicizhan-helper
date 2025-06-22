;(function(window, $) {
    'use strict';

    const apiModule = window.apiModule;
    const storageModule = window.storageModule;
    const $table = $('#purchaseTable');

    async function initTrail() {
        try {
            let isTrial = await apiModule.hasTrial();

            if (!isTrial) {            
                $('#trialDiv').show();
                $('#trialBtn').on('click', applyTrial);
            }
        } catch (error) {
            console.error('检查试用信息失败:', error);
        }
    }

    async function applyTrial() {
        if (confirm(`是否申请试用？`)) {
            window.Analytics.fireEvent('charge.trial', {});

            try {
                await apiModule.createTrialOrder();
                $table.bootstrapTable('refresh');
            } catch(e) {
                window.Analytics.fireErrorEvent(e, { message: '申请试用失败' });
                alert(e.message || '申请试用失败');
                console.error(e);
            }
        }
    }

    async function renderGoods() {        
        const goods = await apiModule.getGoodsList();
        const $container = $('#goodsContainer');
        goods.forEach(good => {
            const discountPercent = Math.round(good.discount * 100);
            const $goodCard = $(`
                <div class="col-md-4">
                    <div class="price-card">
                        <div>
                            <h3>${good.name}</h3>
                            <div class="duration">${good.effectDays}天</div>
                            <div class="mt-3">
                                <span class="original-price">¥${good.price/100}</span>
                                <span class="current-price">¥${good.realPrice/100}</span>
                                <span class="discount-badge">${discountPercent}% OFF</span>
                            </div>
                        </div>
                        <button class="btn btn-primary buy-btn" data-goods-id="${good.id}">购买</button>
                    </div> 
                </div>
            `);
            $container.append($goodCard);
        });

        $('.buy-btn').on('click', async function() {
            const $that = $(this);
            const goodsId = $that.data('goods-id');
            const goodsName = $that.closest('.price-card').find('h3').text();
            window.Analytics.fireEvent('charge.click', {});
            createOrder(goodsId, goodsName);
        });
    }

    async function createOrder(goodsId, goodsName) {
        if (confirm(`是否购买${goodsName}？`)) {
            window.Analytics.fireEvent('charge.confirm', {});

            try {            
                let orderNo = await apiModule.createOrder(goodsId);
        
                if (!orderNo) {
                    alert('购买失败，请稍候重试');
                    return;
                }
                
                $table.bootstrapTable('refresh');
                window.open(`/src/pay.html?orderNo=${orderNo}`, '_blank');
            } catch (err) {
                window.Analytics.fireErrorEvent(err, { message: `购买${goodsId}套餐失败` });
                alert(err.message || '购买失败，请稍候重试');
                console.error(err);
            }
        } else {
            window.Analytics.fireEvent('charge.cancel', {});
        }
    }

    async function initOrderTable() {
        let [host, port, accessToken] = await storageModule.get(['host', 'port', 'accessToken']);

        $table.bootstrapTable({
            url: `http://www.baicizhan-helper.cn/orderInfo`,
            ajaxOptions: {
                headers: {
                    'access_token': accessToken
                }
            },
            responseHandler: function(res) {
                if (res.code === 200) {
                    return res.data;
                }
                return {total: 0, rows: []};
            },
            method: 'GET',
            pagination: true,
            pageSize: 5,
            locale: 'zh-CN',
            columns: [{
                field: 'orderNo',
                title: '订单号'
            }, {
                field: 'goodsName',
                title: '会员类型'
            }, {
                field: 'amount',
                title: '支付金额',
                formatter: function(value) {
                    return `${value / 100} 元`;
                }
            }, {
                field: 'payTime',
                title: '付款时间',
                sortable: true,
                formatter: function(value) {
                    let date = new Date(value);
                    return date.getTime() <= 0 ? '-' : date.toLocaleDateString();
                }
            },{
                field: 'effectTime',
                title: '生效时间',
                sortable: true
            }, {
                field: 'stateText',
                title: '状态',
                sortable: true,
                formatter: function(value, row) {
                    if (row.state === 0) {
                        return value + `&nbsp;<a href="/src/pay.html?orderNo=${row.orderNo}" target="_blank">去支付</span>`;
                    } 

                    return value;
                }
            }]
        });    
    }

    function checkAccount() {
        apiModule.getUserInfo().then(data => {
            let weixinBindInfo = data.filter(item => item.provider === 'weixin');  

            if (!weixinBindInfo.length) {
                $('#tips').html('提示：您当前账号未绑定微信，可能与百词斩 APP 登录账号不为同一账号，请确认两者用户名是否一致！');
            }
        });
    }

    function initQrCode() {
        apiModule.getOrderInfos().then(data => {
           let paidOrders = data.rows
                .filter(item => item.state >= 2 && item.amount > 0);

           if (paidOrders.length > 0) {
               $('#qrCodeDiv').show().on('click', function() {
                   $('#qrCodeModal').modal('show');
               });
           }
        });
    }

    function init() {
        initTrail();
        renderGoods();
        initOrderTable();
        checkAccount();
        initQrCode();
        $('[data-toggle="tooltip"]').tooltip();
        window.Analytics.firePageViewEvent('charge', 'charge.html');
    }

    window.onload = init;
}) (this, jQuery);