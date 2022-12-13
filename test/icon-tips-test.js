// 元素在最上方，图标应该展示在内容下面
$('#p1').iconTips({imgSrc: '../src/options/assets/baicizhan-helper.png'});

// 元素在最下方，图标应该展示在内容上面
$('#p2').iconTips({imgSrc: '../src/options/assets/baicizhan-helper.png'});

// 图标内容不会受外界样式影响

// 图标点击后事件回调
// 图标隐藏后事件回调
$('#p3').iconTips({
    onClick: ($target) => console.log($target, 'clicked'),
    onHide: ($target) => console.log($target, 'hided'),
    imgSrc: '../src/options/assets/baicizhan-helper.png'
});
