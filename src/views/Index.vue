<script setup>
import { ref, computed, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useStore } from 'vuex'
import RecordLeft from '../components/RecordLeft.vue'
import RecordRight from '../components/RecordRight.vue'
import { ElMessageBox } from 'element-plus'

// 全局变量
const store = useStore()
const { proxy } = getCurrentInstance()

const recordLeft = ref()
const recordRight = ref()

const isLeftExpand = computed(() => {
    return store.state.isLeftExpand
})
const isMobile = computed(() => {
    return store.state.isMobile
})

// 函数
const closeLeft = () => {
    store.commit('changeIsLeftExpand')
}
const addRecord = async (day, index) => {
    await proxy.$DB.add('records', {
        date: day,
        title: `记录${index}`,
        index: index,
        record: ''
    })
    await selectRecords()
}
const selectRecords = async () => {
    const date = proxy.$XEUtils.toDateString(recordLeft.value.calendarValue, 'yyyy-MM-dd')
    const recordList = await proxy.$DB.getByIndex('records', 'date', date)
    recordLeft.value.recordList = proxy.$XEUtils.orderBy(recordList, 'index')
}
const changeRecord = async () => {
    const uid = recordLeft.value.recordUid
    const record = await proxy.$DB.get('records', uid)
    recordRight.value.content = record.record
}
const saveRecord = async (content) => {
    const uid = recordLeft.value.recordUid
    const record = await proxy.$DB.get('records', uid)
    record.record = content
    await proxy.$DB.put('records', record)
    selectRecords()
}
const deleteRecord = async () => {
    ElMessageBox.confirm('是否删除该记录，删除后无法恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        const uid = recordLeft.value.recordUid
        await proxy.$DB.delete('records', uid)
        selectRecords()
        // 清除uid和右侧内容
        recordLeft.value.recordUid = null
        store.commit('changeIsSaved', false)
        recordRight.value.content = ''
    }).catch(() => { })
}
const exportData = async () => {
    try {
        await proxy.$DB.exportToFile()
        ElMessageBox.alert('数据导出成功！', '提示', {
            confirmButtonText: '确定',
            type: 'success',
        })
    } catch (error) {
        ElMessageBox.alert('数据导出失败：' + error.message, '错误', {
            confirmButtonText: '确定',
            type: 'error',
        })
    }
}
const importData = async () => {
    // 创建文件选择器
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.db,.sqlite,.sqlite3,.json'
    
    input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        
        try {
            // 询问用户是否清空现有数据
            await ElMessageBox.confirm(
                '导入数据时，是否清空现有数据？选择"确定"将清空现有数据后导入，选择"取消"将合并导入。',
                '导入选项',
                {
                    confirmButtonText: '清空后导入',
                    cancelButtonText: '合并导入',
                    type: 'warning',
                }
            ).then(async () => {
                // 清空后导入
                const result = await proxy.$DB.importFromFile(file, { clearBeforeImport: true })
                handleImportResult(result)
            }).catch(async () => {
                // 合并导入
                const result = await proxy.$DB.importFromFile(file, { clearBeforeImport: false })
                handleImportResult(result)
            })
        } catch (error) {
            ElMessageBox.alert('数据导入失败：' + error.message, '错误', {
                confirmButtonText: '确定',
                type: 'error',
            })
        }
    }
    
    input.click()
}
const handleImportResult = async (result) => {
    if (result.success) {
        let message = '数据导入成功！\n\n'
        for (const [storeName, count] of Object.entries(result.imported)) {
            message += `${storeName}: ${count} 条记录\n`
        }
        
        await ElMessageBox.alert(message, '导入成功', {
            confirmButtonText: '确定',
            type: 'success',
        })
        
        // 刷新记录列表
        await selectRecords()
        // 清除当前选中的记录
        recordLeft.value.recordUid = null
        recordRight.value.content = ''
    } else {
        let message = '数据导入完成，但有部分错误：\n\n'
        result.errors.forEach(error => {
            message += `- ${error}\n`
        })
        
        await ElMessageBox.alert(message, '导入警告', {
            confirmButtonText: '确定',
            type: 'warning',
        })
        
        // 刷新记录列表
        await selectRecords()
    }
}

// 加载
onMounted(async () => {
    // 等待 DOM 更新完成后再访问子组件
    await nextTick()
    selectRecords()
})
</script>

<template>
    <el-container class="h-100%">
        <!-- 移动端遮罩层 -->
        <transition name="fade">
            <div v-if="isMobile && isLeftExpand" class="mobile-overlay" @click="closeLeft"></div>
        </transition>
        <!-- 左侧面板 -->
        <transition :name="isMobile ? 'slide-mobile' : 'slide'">
            <el-aside :width="isMobile ? '80%' : '400px'" v-show="isLeftExpand" :class="{ 'mobile-sidebar': isMobile, 'desktop-sidebar': !isMobile }">
                <RecordLeft ref="recordLeft" @add-new-record="addRecord" @select-record="selectRecords" @change-record="changeRecord" @delete-record="deleteRecord" @export-data="exportData" @import-data="importData" />
            </el-aside>
        </transition>
        <el-main class="main-content" :class="{ 'main-expanded': !isMobile && isLeftExpand }">
            <div class="content-wrapper">
                <RecordRight ref="recordRight" @save-content="saveRecord" />
            </div>
        </el-main>
    </el-container>
</template>

<style lang="scss" scoped>
/* 移动端遮罩层 */
.mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
}

/* 移动端侧边栏悬浮样式 */
.mobile-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1000;
    background-color: white;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    overflow-y: auto;
}

/* 桌面端侧边栏样式 */
.desktop-sidebar {
    overflow-y: auto;
}

/* 主内容区域 */
.main-content {
    flex: 1;
    overflow: hidden;
    position: relative;
    transition: all 0.3s ease;
}

/* 当左侧展开时,主内容区域自动调整 */
.main-expanded {
    flex: 1;
}

/* 内容包装器 */
.content-wrapper {
    width: 100%;
    height: 100%;
}

/* 遮罩层淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* 桌面端左侧面板滑动动画 */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(-100%);
    opacity: 0;
}

/* 移动端左侧面板滑动动画 */
.slide-mobile-enter-active,
.slide-mobile-leave-active {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-mobile-enter-from,
.slide-mobile-leave-to {
    transform: translateX(-100%);
}

/* 右侧内容区域动画 */
.content-shift-enter-active,
.content-shift-leave-active {
    transition: all 0.3s ease;
}

.content-shift-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.content-shift-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}
</style>
