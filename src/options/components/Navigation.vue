<script>
const tabs = ['book', 'popoverStyle', 'settings'];

export default {
    data() {
        return {
            selectedTab: 'book'
        }
    },
    watch: {
        selectedTab() {
            this.$refs.menu['default-active'] = tabs[this.selectedTab] + 1;

            this.$emit('selectTab', this.selectedTab);
        }
    },
    emits: ['selectTab']
}
</script>

<template>
    <el-menu ref="menu" default-active="1" class="el-menu-vertical-demo" style="border: none;">
        <el-menu-item index="1" @click="selectedTab = 'book'">
            <el-icon>
                <Collection />
            </el-icon>
            <span>单词本</span>
        </el-menu-item>
        <el-menu-item index="2" @click="selectedTab = 'popoverStyle'">
            <el-icon>
                <ChatSquare />
            </el-icon>
            <span>弹窗样式</span>
        </el-menu-item>
        <el-menu-item index="3" @click="selectedTab = 'settings'">
            <el-icon>
                <Setting />
            </el-icon>
            <span>设置</span>
        </el-menu-item>
    </el-menu>
</template>