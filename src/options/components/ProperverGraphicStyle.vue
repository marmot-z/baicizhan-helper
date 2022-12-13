<script>
import SoundSizeIcon from './SoundSizeIcon.vue';

const style = 'graphic';

export default {
    data() {
        return {
            style,
            imgUrl: 'https://7n.bczcdn.com/r/1423913156278.jpg'
        }
    },
    components: {
        SoundSizeIcon
    },
    methods: {
        change() {
            if (this.selectedStyle != style) {
                this.$emit('change', style);

                chrome.storage.local.set({'baicizhanHelper.popoverStyle': style});
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
    <p class="title">图文模式</p>
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

        <div style="padding-top: 10px; border-top: 1px solid var(--el-card-border-color);">
            <img :src="imgUrl" style="height: 140px;" />
            <p class="sentence">She said I did a <span style="color: #409EFF;">good</span> job.</p>
            <p class="sentence">她说我干得不错。</p>
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
    line-height: 18px;
}

.meaning:first-child {
    margin-top: 0px;
}

.sentence {
    margin-top: 5px;
    height: 10px;
    line-height: 10px;
}

.footer {
    position: absolute;
    bottom: 0px;
}
</style>