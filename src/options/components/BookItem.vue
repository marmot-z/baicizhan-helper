<script>
export default {
    props: {
        cover: String,
        book_name: String,
        word_num: Number,
        user_book_id: Number,
        selectedBookId: Number,
    },
    methods: {
        select() {
            // 未选中时，点击则选中
            if (this.selectedBookId != this.user_book_id) {
                this.$emit('selected', this.user_book_id);

                chrome.storage.local.set({'baicizhanHelper.bookId': this.user_book_id});
            }
        }
    },
    emits: ['selected']
}
</script>

<template>
    <el-row class="bookItem">
        <el-col :xl="2" :lg="1" :offset="1" class="radio">
            <el-icon size="20" color="#409EFF" @click="select()">
                <CircleCheckFilled v-if="(selectedBookId === user_book_id)" />
                <CircleCheck v-else/>
            </el-icon>
        </el-col>
        <el-col :lg="6" :xl="5" :offset="1">
            <img :src="cover" class="img"/>
        </el-col>
        <el-col :lg="8" :xl="6">
            <p class="bookName">{{ book_name }}</p>
            <span class="wordCount">已收录 {{ word_num }} 词</span>
        </el-col>
    </el-row>
</template>

<style scoped>
.bookItem {
    height: 150px;
    background-color: white;
    border-radius: 1em;
    box-shadow: 8px 5px 5px silver;
    margin-bottom: 25px;
}

.img {
    height: 140px;
    margin-top: 5px;
}

.radio {
    line-height: 150px; 
    cursor: pointer;
}

.bookName {
    font-size: large; 
    padding-top: 10px;
}

.wordCount {
    font-size: small;
    color: #6f6c6c;
}
</style>