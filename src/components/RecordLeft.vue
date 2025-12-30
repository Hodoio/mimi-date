<script setup>
import { ref, watch, defineProps, defineExpose, defineEmits, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'
import { Delete, Upload, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 全局变量
const { proxy } = getCurrentInstance()
const store = useStore()
const emit = defineEmits([
    'addNewRecord',
    'selectRecord',
    'changeRecord',
    'deleteRecord',
    'exportData',
    'importData'
])
const calendarValue = ref(new Date())
const recordList = ref([])
const recordUid = ref(null)

// 函数
const handlerDateFormat = (date) => {
    const day = proxy.$XEUtils.toDateString(date, 'yyyy-MM-dd')
    let index = 1
    if (recordList.value.length > 0) {
        index = recordList.value.at(-1).index + 1
    }
    return { day, index }
}
const handlerAddNewRecord = () => {
    const nowCalendarValue = calendarValue.value
    const { day, index } = handlerDateFormat(nowCalendarValue)
    emit('addNewRecord', day, index)
}
const handlerSelectRecord = () => {
    const nowCalendarValue = calendarValue.value
    const { day } = handlerDateFormat(nowCalendarValue)
    emit('selectRecord', day)
}
const handlerCutRecordContent = (record) => {
    if (record.length > 25) {
        return record.substr(0, 22) + '...'
    }
    if (record.length === 0) {
        return '暂无内容'
    }
    return record
}
const handlerChoiceRecord = (uid) => {
    store.commit('changeIsSaved', true)
    recordUid.value = uid
    emit('changeRecord')
}
const handlerDeleteRecord = (uid) => {
    emit('deleteRecord')
}
const handlerExportData = () => {
    emit('exportData')
}
const handlerImportData = () => {
    emit('importData')
}

// 监听
watch(calendarValue, () => {
    handlerSelectRecord()
})

defineExpose({
    calendarValue,
    recordList,
    recordUid
})
</script>

<template>
    <div>
        <div class="mb-10px">
            <el-calendar v-model="calendarValue" />
        </div>
        <div>
            <div class="flex justify-between items-center px-18px">
                <el-button type="primary" @click="handlerAddNewRecord">新增记录</el-button>
                <div>
                    <el-button :icon="Download" @click="handlerExportData" title="导出数据">导出</el-button>
                    <el-button :icon="Upload" @click="handlerImportData" title="导入数据">导入</el-button>
                </div>
            </div>
            <div class="mt-12px h-[calc(100vh-500px)] px-12px overflow-y-auto">
                <template v-if="recordList.length > 0">
                    <el-card class="mb-8px" 
                        :class="[recordUid === item.uid ? 'border-color-[var(--el-color-primary)]' : '']"
                        v-for="(item, _) in recordList" :key="item.uid" shadow="never" @click="handlerChoiceRecord(item.uid)">
                        <div class="flex justify-between items-center">
                            <el-tag type="info">{{ item.title }}</el-tag>
                            <div>
                                <el-button :icon="Delete" text @click="handlerDeleteRecord"></el-button>
                            </div>
                        </div>
                        <div class="font-size-12px text-color-gray p-2px">
                            {{ handlerCutRecordContent(item.record) }}
                        </div>
                    </el-card>
                </template>
                <el-empty v-else></el-empty>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
:deep(.el-calendar .el-calendar-table .el-calendar-day) {
    width: 100%;
    height: 43px !important;
    text-align: center;
}

:deep(.el-calendar .el-calendar__body) {
    padding-bottom: 0 !important;
}
</style>
