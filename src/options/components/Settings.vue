<script>
// 默认代理服务器 ip
const defaultProxyHost = '43.142.135.24';
// 默认代理服务器端口
const defaultProxyPort = 8080;
// 默认弹出翻译方式
const defaultTriggerMode = "1";
// 默认主题
const defaultTheme = 'light';

export default {
    data() {
        return {
            triggerMode: defaultTriggerMode,
            theme: defaultTheme,
            host: defaultProxyHost,
            port: defaultProxyPort,            
        }
    },
    mounted() {
        chrome.storage.local.get([
            'baicizhanHelper.proxyHost',
            'baicizhanHelper.proxyPort',
            'baicizhanHelper.triggerMode',
            'baicizhanHelper.theme',
        ], results => {
            this.host = results['baicizhanHelper.proxyHost'] || defaultProxyHost;
            this.port = results['baicizhanHelper.proxyPort'] || defaultProxyPort;
            this.triggerMode = results['baicizhanHelper.triggerMode'] || defaultTriggerMode;
            this.theme = results['baicizhanHelper.theme'] || defaultTheme;

            // to string
            this.triggerMode += '';
        });
    },
    methods: {
        reset() {
            this.host = defaultProxyHost;
            this.port = defaultProxyPort;
            this.triggerMode = defaultTriggerMode;
            this.theme = defaultTheme;
        },
        save() {
            chrome.storage.local.set({ 'baicizhanHelper.proxyHost': this.host });
            chrome.storage.local.set({ 'baicizhanHelper.proxyPort': this.port });
            chrome.storage.local.set({ 'baicizhanHelper.triggerMode': this.triggerMode });
            chrome.storage.local.set({ 'baicizhanHelper.theme': this.theme });
        }
    }
}
</script>

<template>
    <el-row>
        <el-col :span="14" :offset="5" class="panel">
            <el-row class="settingItem">
                <el-col :lg="4" :xl="3" :offset="1" class="settingName">主题风格：</el-col>
                <el-col :lg="18" :xl="19">
                    <el-radio-group v-model="theme" class="ml-4">
                        <ul>
                            <li>
                                <el-radio label="light" size="large" @change="val => theme = val">明亮</el-radio>
                            </li>
                            <li>
                                <el-radio label="dark" size="large" @change="val => theme = val">暗黑</el-radio>
                            </li>
                            <li>
                                <el-radio label="auto" size="large" @change="val => theme = val">跟随系统</el-radio>
                            </li>
                        </ul>
                    </el-radio-group>
                </el-col>
            </el-row>

            <el-row class="settingItem">
                <el-col :lg="4" :xl="3" :offset="1" class="settingName">弹出翻译：</el-col>
                <el-col :lg="18" :xl="19">
                    <el-radio-group v-model="triggerMode" class="ml-4">
                        <ul>
                            <li>
                                <el-radio label="1" size="large" @change="val => triggerMode = val">显示点击既可翻译的图标</el-radio>
                            </li>
                            <li>
                                <el-radio label="2" size="large" @change="val => triggerMode = val">立即弹出翻译</el-radio>
                            </li>
                            <li>
                                <el-radio label="3" size="large" @change="val => triggerMode = val">不显示图标和弹出式翻译</el-radio>
                            </li>
                        </ul>
                    </el-radio-group>
                </el-col>
            </el-row>

            <el-row class="settingItem">
                <el-col :lg="4" :xl="3" :offset="1" class="settingName">代理服务器：</el-col>
                <el-col :lg="18" :xl="19" :offset="1">
                    <div>
                        <el-input v-model="host" class="hostInput" size="large" placeholder="主机名或 ip 地址">
                            <template #prepend>Http://</template>
                        </el-input>
                        :
                        <el-input v-model="port" class="portIput" size="large" placeholder="端口" />
                    </div>
                </el-col>
            </el-row>

            <el-row class="mb-4 footer">
                <el-col :span="10" :offset="2">
                    <el-button type="primary" @click="save()" plain>保存</el-button>
                    <el-button type="info" @click="reset()" plain>重置</el-button>
                </el-col>
            </el-row>
        </el-col>
    </el-row>
</template>

<style scoped>
.panel {
    height: 600px;
    background-color: #f9fafc;
    border-radius: 1em;
}

.settingItem {
    margin-top: 40px;
}

.settingName {
    padding-top: 10px;
    color: #303133;
    font-weight: bold;
}

@media (min-width: 1200px) {
    .hostInput {
        width: 50%;
    }

    .portIput {
        width: 30%;
    }
}

@media (min-width: 1920px) {
    .hostInput {
        width: 40%;
    }

    .portIput {
        width: 20%;
    }
}

.footer {
    margin-top: 40px;
}
</style>