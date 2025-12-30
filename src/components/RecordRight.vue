<script setup>
import { ref, computed, watch, defineExpose, nextTick, defineEmits, onMounted } from 'vue'
import Editor from './Editor.vue'
import LogoSVG from '@/assets/logo.svg'
import { Menu } from '@element-plus/icons-vue'
import { useStore } from 'vuex'

const store = useStore()
const emit = defineEmits([
    'saveContent'
])
const editor = ref(null)
const editorShow = ref(true)
const content = ref('')
const editorHeight = computed(() => {
    const windowHeight = window.innerHeight
    return windowHeight - 100
})
const isSaved = computed(() => {
    return store.state.isSaved
})

// 函数
const changeLeftExpand = () => {
    return store.commit('changeIsLeftExpand')
}
const handlerSaveContent = () => {
    const editorContent = editor.value.vditor.getValue()
    emit('saveContent', editorContent)
}

// 监听
watch(content, async () => {
    editorShow.value = false
    await nextTick()
    editorShow.value = true
})
watch(isSaved, (newVal) => {
    if (newVal) {
        editor.value.vditor.enable()
    } else {
        editor.value.vditor.disabled()
    }
})

onMounted(async () => {
    await nextTick()
    setTimeout(() => {
        editor.value.vditor.disabled()
    }, 200)
})

defineExpose({
    content
})
</script>

<template>
    <div>
        <div class="flex justify-between mb-16px">
            <div>
                <el-button :icon="Menu" @click="changeLeftExpand" circle></el-button>
            </div>
            <div class="flex justify-center items-center gap-4px font-size-18px font-bold">
                <img :src="LogoSVG" class="h-18px" />
                <span>米米记录</span>
            </div>
            <div>
                <el-button :disabled="!isSaved" circle @click="handlerSaveContent">存</el-button>
            </div>
        </div>
        <Editor ref="editor" v-if="editorShow" :editor-height="editorHeight" :default-content="content" />
    </div>
</template>

<style lang="scss" scoped>

</style>
