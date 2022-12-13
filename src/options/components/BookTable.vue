<script>
import BookItem from './BookItem.vue';
import interfaces from '../serve/serve';
import { ElMessage } from 'element-plus';

export default {
    data() {
        return {
            items: [],
            selectedBookId: -1
        }
    },
    mounted() {
        let loadBooks = () => interfaces.getBooks()
            .then(result => this.items = result.data.user_books)
            .catch(e => ElMessage.warning('您尚未登录'));
        
        loadBooks();

        chrome.storage.local.get(['baicizhanHelper.bookId'], results => {
            let bookId = results['baicizhanHelper.bookId'];
            
            this.selectedBookId = typeof bookId == 'undefined' ? -1 : bookId;
        });
        chrome.storage.onChanged.addListener((changes, namespace) => {
            for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
                if (key == 'baicizhanHelper.accessToken') {                    
                    newValue ?
                        // 更换了用户信息，重新加载单词本列表
                        loadBooks() :
                        // 用户退出，单词本列表置空
                        this.items = []; 
                }
            }
        });
    },
    components: {
        BookItem
    }
}
</script>

<template>
    <el-row>
        <el-col :span="14" :offset="5" class="panel">
            <h3 class="title">请挑选单词本：</h3>
            <el-row>
                <el-col :span="18" :offset="3">
                    <el-scrollbar height="600px">
                        <BookItem 
                            v-for="item in items" 
                            v-bind="item"
                            :selectedBookId="selectedBookId"                             
                            @selected="i => selectedBookId = i" 
                        />
                    </el-scrollbar>
                </el-col>
            </el-row>
        </el-col>
    </el-row>
</template>

<style scoped>
.panel {
    overflow-y: hidden;
    height: 600px;
    background-color: #f9fafc;
    border-radius: 1em;
}

.title {
    color: #303133;
}
</style>