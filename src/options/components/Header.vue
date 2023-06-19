<script>
import { ref } from 'vue'
import interfaces from '../serve/serve'
import { ElMessage } from 'element-plus'
import icon from '../../../public/baicizhan-helper.png'

/**
 * 检查手机号码是否合法
 * @param {*} rule 
 * @param {*} value 
 * @param {*} callback 
 */
const checkPhoneNum = (rule, value, callback) => {
    if (!/^\d{11}$/.test(value)) {
        callback(new Error('请输入 11 位手机号码'));
    } else {
        callback();
    }
};

/**
 * 检查验证码是否合法
 * @param {*} rule 
 * @param {*} value 
 * @param {*} callback 
 */
const checkVerifyCode = (rule, value, callback) => {
    if (!/^\d{6}$/.test(value)) {
        callback(new Error('请输入 6 位验证码'));
    } else {
        callback();
    }
};

export default {
    data() {
        return {
            icon,                           // 插件图标地址
            dialogLoginVisible: false,      // 登录弹框是否可见
            countingDown: false,            // 是否正在倒计时
            remainder: 60,                  // 倒计时余数
            logined: false,                 // 是否登录
            username: '',                   // 用户昵称
            form: {
                phoneNum: '',               // 手机号码
                verifyCode: '',             // 验证码
            },
            rules: ref({                    // 表单验证规则
                phoneNum: [{
                    validator: checkPhoneNum,
                    trigger: 'blur',
                    require: true
                }],
                verifyCode: [{
                    validator: checkVerifyCode,
                    trigger: 'blur',
                    require: true
                }]
            })
        }
    },
    mounted() {
        // 从本地存储中获取登录 token 和用户信息
        chrome.storage.local.get([
            'baicizhanHelper.accessToken',
            'baicizhanHelper.username'
        ], (result) => {
            this.logined = !!result['baicizhanHelper.accessToken'];
            this.username = result['baicizhanHelper.username'] || '';
        });
    },
    methods: {
        login() {            
            this.$refs.loginFormRef.validate(valid => {
                if (valid) {
                    // 登录弹窗关闭                    
                    this.dialogLoginVisible = false;

                    interfaces.login(this.form.phoneNum, this.form.verifyCode)
                        .then(loginInfo => {
                            // 用户态信息写入本地存储中
                            chrome.storage.local.set({ 'baicizhanHelper.accessToken': loginInfo.data.access_token });

                            return interfaces.getUserInfo();
                        })
                        .then(userInfo => {
                            this.logined = true;
                            this.username = userInfo.data[0]?.nickname || 'guest';

                            chrome.storage.local.set({ 'baicizhanHelper.username': userInfo.data[0]?.nickname });

                            ElMessage.success('登录成功');
                        })
                        .catch(err => ElMessage.error('登录失败，请稍后尝试'));
                }
            });
        },
        logout() {         
            this.logined = false;
            this.username = '';

            // 清空本地存储
            chrome.storage.local.clear();
        },
        getVerifyCode() {
            this.$refs.loginFormRef.validateField('phoneNum', (valid, err) => {
                if (valid) {
                    interfaces.getVerifyCode(this.form.phoneNum)
                        .then(resp => ElMessage.success(`已向 ${this.form.phoneNum} 发送验证码，请注意查收`))
                        .catch(err => ElMessage.error('发送短信验证码失败，请稍后重试'));

                    this.countingDown = true;

                    // 倒计时
                    let intervalId = setInterval(() => {
                        if (!this.remainder) {
                            clearInterval(intervalId);
                            this.remainder = 60;
                            this.countingDown = false;

                            return;
                        }

                        this.remainder--;
                    }, 1000);
                }
            });
        }
    }
}
</script>


<template>
    <el-row class="nav">
        <el-col :span="2">
            <div class="grid-content ep-bg-purple">
                <el-image class="icon" :src="icon" fit="fill" />
            </div>
        </el-col>

        <el-col :span="1" :offset="18">
            <div class="grid-content ep-bg-purple">
                <a href="http://110.42.229.221:8080/comments" target="_blank" title="填写问题/建议">问题反馈</a>
            </div>
        </el-col>

        <el-col :span="2" :offset="1">
            <el-dropdown v-if="!logined" class="userInfo">
                <span class="el-dropdown-link" >
                    <el-icon>
                        <Avatar />
                    </el-icon>
                    &nbsp;请登录
                    <el-icon class="el-icon--right">
                        <arrow-down />
                    </el-icon>
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="(dialogLoginVisible = true, login())">登录</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>

            <el-dropdown v-else class="userInfo">
                <span class="el-dropdown-link" >
                    <el-icon>
                        <Avatar color="#409EFF"/>
                    </el-icon>
                    &nbsp;{{ username.length > 7 ? username.substring(0, 7) + '...' : username }}
                    <el-icon class="el-icon--right">
                        <arrow-down />
                    </el-icon>
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="logout()">退出</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </el-col>
    </el-row>

    <el-dialog v-model="dialogLoginVisible" title="手机验证码登录" center>
        <el-form ref="loginFormRef" :model="form" :rules="rules" status-icon label-width="120px">
            <el-form-item label="手机号码" prop="phoneNum">
                <el-input v-model="form.phoneNum" autocomplete="off" placeholder="请输入 11 位手机号码" />
            </el-form-item>
            <el-form-item label="验证码" prop="verifyCode">
                <el-input v-model="form.verifyCode" placeholder="请输入 6 位验证码">
                    <template #append>
                        <el-button v-if="!countingDown" type="primary" class="getVerifyCodeBtn"
                            @click="getVerifyCode()">获取验证码</el-button>
                        <el-button v-else type="primary" class="getVerifyCodeBtn" disabled>{{ remainder }}s</el-button>
                    </template>
                </el-input>
            </el-form-item>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogLoginVisible = false">取消</el-button>
                <el-button type="primary" @click="login()">登录</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<style scoped>
.nav {
    border-radius: 1em;
    background-color: #f4f4f6;
    height: 60px;
    line-height: 60px;
}

.icon {
    width: 44px;
    height: 44px;
    margin: 8px 0px;
    margin-left: 20px;
    border-radius: 4px;
}

.userInfo {
    font-size: medium;
    vertical-align: middle;
}

.getVerifyCodeBtn {
    width: 140px;
}
</style>