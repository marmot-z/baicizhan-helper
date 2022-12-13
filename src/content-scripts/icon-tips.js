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
        var style = 'width: 25px; height: 25px; z-index: 9999;';
        var iconStyle = 'max-width: 25px; border-radius: 5px; opacity: 0.8; cursor: pointer;';
        var _bodyEventHandled = false;

        function IconTips(element, options) {
            this.$el = $(element);
            this.options = options;
            this._isShow = true;
            this.init();
        }

        IconTips.prototype.init = function() {            
            var $target = $('<div style="position: absolute;"/>');            
            var shadow = $target.get(0).attachShadow({mode: 'open'});
            var position = this.calcutePosition();
            var $body = $(document.body);

            shadow.innerHTML = `
                <div style="${style}">
                    <img src="${this.options.imgSrc}" style="${iconStyle}" />
                </div>
            `;

            $target.css('top', position.top).css('left', position.left);

            if ($.isFunction(this.options.onClick)) {
                $target.on('click', (e) => this.options.onClick(this.$target, e));
            }

            $body.append(this.$target = $target);

            $body.off('mouseup.iconTips')
                .on('mouseup.iconTips', (e) => {
                    e.preventDefault();

                    // 点击其他地方时，隐藏该图标
                    e.target != this.$target.get(0) && this.isShow() && this.hide();                    
                });
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

        IconTips.prototype.hide = function() {
            this._isShow = false;
            this.$target.hide();

            if ($.isFunction(this.options.onHide)) {
                this.options.onHide(this.$target);
            }
        };

        IconTips.prototype.destroy = function() {
            $(document.body).off('mouseup.iconTips');                        
            this.$el.data('plugin_' + pluginName, null);
            this.$target.remove();
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