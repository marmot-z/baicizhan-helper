<script>
import Header from './components/Header.vue'
import BookTable from './components/BookTable.vue';
import Navigation from './components/Navigation.vue';
import PopoverStyle from './components/PopoverStyle.vue';
import Settings from './components/Settings.vue';

export default {
	data() {
		return {
			selectedTab: 'book'
		}
	},
	components: {
		Header,
		BookTable,
		Navigation,
		PopoverStyle,
		Settings
	}
}
</script>


<template>
	<div class="common-layout">
		<el-container>
			<el-header class="header">
				<Header />
			</el-header>

			<el-container>
				<el-aside class="aside">
					<Navigation class="navigation" @selectTab="(tab) => selectedTab = tab" />
				</el-aside>

				<el-main class="main">
					<BookTable v-if="selectedTab == 'book'"></BookTable>
					<PopoverStyle v-if="selectedTab == 'popoverStyle'"></PopoverStyle>
					<Settings v-if="selectedTab == 'settings'"></Settings>
				</el-main>
			</el-container>
		</el-container>
	</div>
</template>

<style scoped>
.header {
	height: 60px;
}

.aside {
	width: 16%;
	height: 90vh;
	border-right: 1px solid var(--el-border-color);
}

.navigation {
	padding-top: 100px;
}

@media (min-width: 1200px) {
	.main {		
		margin-top: 60px;
	}
}

@media (min-width: 1920px) {
	.main {
		margin-top: 100px;
	}
}
</style>