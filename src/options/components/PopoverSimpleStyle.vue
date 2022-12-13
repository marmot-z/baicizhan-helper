<script>
import SoundSizeIcon from './SoundSizeIcon.vue';

const style = 'simple';

export default {
    data() {
        return { style }
    },
    components: {
        SoundSizeIcon
    },
    methods: {
        change() {
            if (this.selectedStyle != style) {
                this.$emit('change', style);

                chrome.storage.local.set({ 'baicizhanHelper.popoverStyle': style });
            }
        }
    },
    props: {
        selectedStyle: String
    },
    emits: ['change']
}
</script>

<template>
    <p class="title">简洁模式</p>
    <el-card class="box-card card">
        <template #header>
            <div class="card-header">
                <span class="word">Good</span>
                <el-icon class="star">
                    <StarFilled />
                </el-icon>

                <p class="sound">
                    <span>/gʊd/</span>
                    <SoundSizeIcon></SoundSizeIcon>
                </p>
            </div>
        </template>
        <div class="text item meaning">
            形容词：令人满意的；有利的；熟练的；好的
        </div>
        <div class="text item meaning">
            副词： 好地
        </div>
        <div class="text item meaning">
            名词： 善行；好处；美德
        </div>

        <div class="footer">
            <el-switch :model-value="(selectedStyle == style)" @change="change()" />
        </div>
    </el-card>
</template>

<style scoped>
.title {
    text-align: center;
    color: #606266;
    font-weight: bold;
}

.card {
    height: 440px;
    width: 100%;
}

.word {
    font-size: large;
    font-weight: bold;
}

.star {
    float: right;
}

.sound {
    height: 20px;
    line-height: 20px;
    margin: 0px;
}

.meaning {
    margin: 10px 0;
}

.meaning:first-child {
    margin-top: 0px;
}

.footer {
    position: absolute;
    bottom: 0px;
}
</style>