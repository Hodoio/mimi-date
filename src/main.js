import { createApp } from 'vue'
import './assets/css/index.scss'
import App from './App.vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'uno.css'
import store from '@/store/index.js'
import { createDB } from '@/lib/indexedDB'
import XEUtils from 'xe-utils'

const db = createDB('mimiDate', 1)
db.addStore('records', {
    keyPath: 'uid',
    autoIncrement: true,
    indexes: [
        { name: 'date', keyPath: 'date' },
        { name: 'index', keypath: 'index' },
        { name: 'title', keypath: 'title' },
        { name: 'record' }
    ]
})

// 使用异步函数确保数据库初始化完成后再挂载应用
async function initApp() {
    // 等待数据库初始化完成
    await db.init()
    
    const app = createApp(App)
    app.use(ElementPlus, {
        locale: zhCn,
    })
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
        app.component(key, component)
    }
    app.config.globalProperties.$XEUtils = XEUtils
    app.config.globalProperties.$DB = db
    app.use(store)
    app.mount('#app')
}

// 启动应用
initApp().catch(err => {
    console.error('应用初始化失败:', err)
})
