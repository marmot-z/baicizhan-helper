;(function(window, document, $) {
    'use strict';

    // 模态框ID
    const MODAL_ID = 'introCarouselModal';
    // localStorage中存储模态框显示状态的键名
    const MODAL_SHOWN_KEY = 'introModalShown';

    // 创建模态框和轮播组件
    function createIntroModal() {
        // 检查模态框是否已经显示过
        if (localStorage.getItem(MODAL_SHOWN_KEY) === 'true') {
            return;
        }

        // 创建模态框HTML
        const modalHtml = `
            <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${MODAL_ID}Label">百词斩助手网页版全新发布，<a href="http://www.baicizhan-helper.cn/" target="_blank">立即前往</a></h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="introCarousel" class="carousel slide" data-ride="carousel">
                                <ol class="carousel-indicators">
                                    <li style="background-color: #6c757d;" data-target="#introCarousel" data-slide-to="0" class="active"></li>
                                    <li style="background-color: #6c757d;" data-target="#introCarousel" data-slide-to="1"></li>
                                    <li style="background-color: #6c757d;" data-target="#introCarousel" data-slide-to="2"></li>
                                    <li style="background-color: #6c757d;" data-target="#introCarousel" data-slide-to="3"></li>
                                    <li style="background-color: #6c757d;" data-target="#introCarousel" data-slide-to="4"></li>
                                    <li style="background-color: #6c757d;" data-target="#introCarousel" data-slide-to="5"></li>                                    
                                </ol>
                                <div class="carousel-inner">
                                    <div class="carousel-item active">
                                        <img src="./assets/images/dashboard.png" class="d-block w-100" alt="个人中心">
                                    </div>
                                    <div class="carousel-item">
                                        <img src="./assets/images/wordbook.png" class="d-block w-100" alt="单词本">
                                    </div>
                                    <div class="carousel-item">
                                        <img src="./assets/images/wordDetail.png" class="d-block w-100" alt="单词详情">
                                    </div>
                                    <div class="carousel-item">
                                        <img src="./assets/images/collect.png" class="d-block w-100" alt="收藏功能">
                                    </div>
                                    <div class="carousel-item">
                                        <img src="./assets/images/search.png" class="d-block w-100" alt="搜索">
                                    </div>
                                    <div class="carousel-item">
                                        <img src="./assets/images/calendar.png" class="d-block w-100" alt="日历">
                                    </div>
                                </div>
                                <a class="carousel-control-prev" style="background-color: silver;" href="#introCarousel" role="button" data-slide="prev">
                                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                    <span class="sr-only">上一张</span>
                                </a>
                                <a class="carousel-control-next" style="background-color: silver;" href="#introCarousel" role="button" data-slide="next">
                                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                    <span class="sr-only">下一张</span>
                                </a>
                            </div>
                        </div>                        
                    </div>
                </div>
            </div>
        `;

        // 将模态框添加到页面
        $(document.body).append(modalHtml);

        // 确保所有轮播图片尺寸一致
        const carouselStyle = `
            <style>
                #${MODAL_ID} .carousel-item img {
                    width: 100%;
                    height: 400px; /* 固定高度 */
                    object-fit: contain; /* 保持图片比例，确保完整显示 */
                }
            </style>
        `;
        $(document.head).append(carouselStyle);

        // 显示模态框
        $(`#${MODAL_ID}`).modal('show');

        // 当模态框关闭时，记录状态到localStorage
        $(`#${MODAL_ID}`).on('hidden.bs.modal', function() {
            localStorage.setItem(MODAL_SHOWN_KEY, 'true');
        });
    }

    // 页面加载完成后显示模态框
    $(document).ready(function() {
        createIntroModal();
    });

})(window, document, jQuery);