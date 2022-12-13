<script>
import PopoverSimpleStyle from './PopoverSimpleStyle.vue';
import ProperverGraphicStyle from './ProperverGraphicStyle.vue';

const defaultPopoverStyle = 'simple';

export default {
    data() {
        return {
            selectedStyle: defaultPopoverStyle
        };
    },
    mounted() {
        chrome.storage.local.get(['baicizhanHelper.popoverStyle'], results => {
            this.selectedStyle = results['baicizhanHelper.popoverStyle'] || defaultPopoverStyle;
        });
    },
    components: {
        PopoverSimpleStyle,
        ProperverGraphicStyle
    }
}
</script>

<template>
    <el-row>
        <el-col :lg="2" :xl="5" />
        <el-col :lg="20" :xl="14" :lg-offset="3" class="panel">
            <h3 style="color: #303133;">请挑选择弹窗样式：</h3>
            <el-row>
                <el-col :lg="1" :xl="2" />
                <el-col :lg="10" :xl="9">
                    <PopoverSimpleStyle :selectedStyle="selectedStyle" @change="style => selectedStyle = style" />
                </el-col>
                <el-col :lg="2" :xl="2" />
                <el-col :lg="10" :xl="9">
                    <ProperverGraphicStyle :selectedStyle="selectedStyle" @change="style => selectedStyle = style" />
                </el-col>
            </el-row>
        </el-col>
    </el-row>
</template>

<style scoped>
.panel {
    overflow-y: auto;
    height: 600px;
    background-color: #f9fafc;
    border-radius: 1em;
}
</style>