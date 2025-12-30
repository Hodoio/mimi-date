<script setup>
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { ref, onMounted, defineExpose } from 'vue'
import { ulid } from 'ulid'

// 全局变量定义
const vditor = ref(null)
const vditorDivId = ulid()

// 传入属性
const props = defineProps({
    editorHeight: {
        type: String,
        default: '100px'
    },
    editorWidth: {
        type: String,
        default: '100%',
    },
    defaultContent: {
        type: String,
        default: ''
    }
})

// 传出属性
defineExpose({
    vditor,
    vditorDivId
})

// 加载后
onMounted(() => {
    vditor.value = new Vditor(vditorDivId, {
        height: props.editorHeight,
        width: props.editorWidth,
        cache: {
            enable: false,
        },
        cdn: "./",
        after: () => {
            if (props.defaultContent) {
                vditor.value.setValue(props.defaultContent)
            }
        }
    })
})
</script>

<template>
    <div :id="vditorDivId"></div>
</template>

<style lang="scss" scoped>

</style>
