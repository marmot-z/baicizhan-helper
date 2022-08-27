;(function(window, document) {
    'use strict';

    (function(factory) {
        if (typeof define === 'function' && define.amd) {
            // Register as an anonymous AMD module.
            define(['jquery'], factory);
        } else if (typeof exports === 'object') {
            // Node/CommonJS
            module.exports = factory(require('jquery'));
        } else {
            // Browser globals
            factory(window.jQuery);
        }
    } (function($) {
        var pluginName = 'iconTips';
        var defaults = {
            template: '<div class="icon-tips"><img class="icon"></div>',
            imgSrc: './images/baicizhan-helper.png',
            onClick: function() {}
        };
        var _bodyEventHandled = false;

        function IconTips(element, options) {
            this.$el = $(element);
            this.options = $.extend({}, defaults, options);
            this._isShow = true;
            this.init();
        }

        IconTips.prototype.init = function() {
            var $target = $(this.options.template);
            var $img = $target.find('img');
            var position = this.calcutePosition();

            $img.attr('src', this.options.imgSrc);
            $target.click(this.options.onClick)
                    .css('top', position.top)
                    .css('left', position.left);
            $(document.body).append($target);
            
            this.$target = $target;
        };

        IconTips.prototype.calcutePosition = function() {
            var position = this.$el.position();
            var elTop = position.top;
            var elLeft = position.left;
            var elHeight = this.$el.height();
            var elWidth = this.$el.width();
            var pageHeight = document.body.clientHeight + document.body.scrollTop;
            var margin = 3;
            var iconHeight = 25;
            var iconWidth = 25;
            // 默认显示在宿主元素下方
            var targetTop = elTop + elHeight + margin;
            // 显示在宿主元素右边
            var targetLeft = elLeft + elWidth - iconWidth;

            // icon 位置是否大于页面高度，是则显示在宿主元素上方
            if (targetTop + iconHeight > pageHeight) {
                targetTop = elTop - margin - iconHeight;
            }

            return {
                top: targetTop,
                left: targetLeft
            };
        };

        IconTips.prototype.refreshPosition = function() {
            var position = this.calcutePosition();

            this.$target.css('top', position.top)
                        .css('left', position.left);
        };

        IconTips.prototype.show = function() {
            this._isShow = true;
            this.$target.show();

            var that = this;

            if (!_bodyEventHandled) {
                $(document).off('mouseup.iconTips')
                        .on('mouseup.iconTips', function() {
                            _bodyEventHandled = true;

                            that.isShow() && that.hide();
                        });
            }
        };

        IconTips.prototype.hide = function() {
            this._isShow = false;
            this.$target.hide();

            if (this.options.onHide) {
                this.options.onHide(this.$target);
            }
        };

        IconTips.prototype.isShow = function() {
            return this._isShow;
        };

        $.fn[pluginName] = function(options) {
            var results = [];
            var $result = this.each(function() {
                var iconTips = $.data(this, 'plugin_' + pluginName);

                if (!iconTips) {
                    if (typeof options === 'object') {
                        iconTips = new IconTips(this, options);

                        $.data(this, 'plugin_' + pluginName, iconTips);
                    }
                } else if (typeof options === 'string') {
                    results.push(iconTips[options]());
                }
            });

            return (results.length) ? results : $result;
        };
     }));
}) (window, document);