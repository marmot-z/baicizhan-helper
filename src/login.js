;(function() {
    function Component(options) {
        this.$el = options.$el;        
        this.preprocessEls = options.preprocessEls;
        this.triggerBy = options.triggerBy;
        this.onTest = options.onTest;
        this.onSuccess = options.onSuccess;
        this.onFail = options.onFail;
        
        this.addEventListener();
    }

    Component.prototype.test = function() {
        var testResult = this.preprocessEls && this.preprocessEls.length ?
                this.preprocessEls
                        .map($el => $el.test())
                        .reduce((a, b) => a && b) :
                true;

        testResult &&= !this.onTest || this.onTest(this.$el);

        return testResult;
    };

    Component.prototype.addEventListener = function() {
        var that = this;
        var listener = function(event) {
            event.preventDefault();
            event.stopPropagation();

            if (that.preprocessEls) {
                that.preprocessEls.forEach($el => $el.trigger());
            }

            !that.test || that.test() ?
                that.onSuccess && that.onSuccess(that.$el) :            
                that.onFail && that.onFail(that.$el);
        };

        this.$el[this.triggerBy](listener);
    };

    Component.prototype.trigger = function() {
        this.$el.trigger(this.triggerBy);
    };

    function CounterComponent(options) {
        Component.call(this, options);

        this.options = options;
        this.time = options.time;
        this.onComplete = options.onComplete;
        this.onCountdown = options.onCountdown;
        this.onStart = options.onStart;
    }

    CounterComponent.prototype = Object.create(Component.prototype);
    CounterComponent.prototype.constructor = CounterComponent;

    CounterComponent.prototype.start = function() {
        this.time = this.options.time;
        this.countdown();
        this.onStart(this.$el, this.time);
    }

    CounterComponent.prototype.countdown = function() {
        var that = this;
        
        this.timer = setTimeout(function() {
            if (!that.time) {
                clearTimeout(that.timer);
                that.onComplete(that.$el);

                return;
            }
    
            that.countdown();
            that.onCountdown(that.$el, --that.time);
        }, 1000);
    }

    function sendSmsVerifyCode(phoneNum) {
        baicizhanHelper.Utils.ajaxPost({
            url: baicizhanHelper.PROXY_HOST + '/login/sendSmsVerifyCode/' + phoneNum
        })
        .then(() => {
            // TODO 弹窗提示发送验证码成功
        })
        .catch(err => {
            // TODO 弹窗提示发送验证码失败
        });
    }

    function login(phoneNum, verifyCode) {
        // TODO 获取用户信息以展示
        baicizhanHelper.Utils.ajaxPost({
            url: baicizhanHelper.PROXY_HOST + '/login/' + phoneNum + '/' + verifyCode
        })
        .then(result => {
            storageAccessToken(result.access_token);

            // 登录成功，跳转到配置页面
            baicizhanHelper.toggle2SettingView();
        })
        .catch(err => {
            // TODO 弹窗提示登录失败
        });
    }

    function storageAccessToken(accessToken) {
        chrome.storage.local.set({'baicizhanHelper.accessToken': accessToken});
        baicizhanHelper.accessToken = accessToken;
    }

    function initialElementEvent() {
        var phoneNumInputComponent = new Component({
            $el: $('#phoneNumInput'),
            triggerBy: 'blur',
            onTest: function($el) {
                return /\d{11}/.test($el.val());
            },
            onSuccess: function($el) {
                var $p = $el.parent().parent();

                $p.removeClass('has-error').addClass('has-success');
                $p.find('.tips').hide();
            },
            onFail: function($el) {
                var $p = $el.parent().parent();

                $p.addClass('has-success').addClass('has-error');
                $p.find('.tips').show();
            }
        });

        var verifyCodeInputCompontent = new Component({
            $el: $('#verifyCodeInput'),
            triggerBy: 'blur',
            onTest: function($el) {
                return /\d{6}/.test($el.val());
            },
            onSuccess: function($el) {
                var $p = $el.parent().parent();

                $p.removeClass('has-error').addClass('has-success');
                $p.find('.tips').hide();
            },
            onFail: function($el) {
                var $p = $el.parent().parent();

                $p.addClass('has-success').addClass('has-error');
                $p.find('.tips').show();
            }
        });

        var verifyCodeBtnComponent = new CounterComponent({
            $el: $('#getVerifyCodeBtn'),
            triggerBy: 'click',            
            preprocessEls: [phoneNumInputComponent],
            time: 60,
            onStart: function($el, time) {
                $el.prop('disabled', true).text(time + 's');
            },
            onCountdown: function($el, time) {
                $el.text(time + 's');
            },
            onComplete: function($el) {
                $el.prop('disabled', false).text('重新获取');
                this.addEventListener();
            },
            onSuccess: function($el) {
                $el.off('click');
                this.start();

                sendSmsVerifyCode(phoneNumInputComponent.$el.val());
            }
        });

        var submitBtnComponent = new Component({
            $el: $('#submitBtn'),
            triggerBy: 'click',
            preprocessEls: [phoneNumInputComponent, verifyCodeInputCompontent],
            onSuccess: function($el) {
                login(phoneNumInputComponent.$el.val(), verifyCodeInputCompontent.$el.val());
            }
        });        
    }

    $('body').one('toggleLoginView', initialElementEvent);
}) ();