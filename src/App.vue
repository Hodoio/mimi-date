<script setup>
import { useStore } from 'vuex'
import Index from '@/views/Index.vue'

// 全局变量
const store = useStore()

// 函数
const isMobileDevice = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera
    const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|windows phone|phone|webos|kindle|tablet/i
    return mobileRegex.test(ua.toLowerCase())
}

const changeStoreIsMobile = () => {
    const isMobile = isMobileDevice()
    store.commit('changeIsMobile', isMobile)
    store.commit('setIsLeftExpand', isMobile ? false : true)
}

// 全局监听函数
window.addEventListener('resize', () => {
    changeStoreIsMobile()
})

// 加载
changeStoreIsMobile()
</script>

<template>
    <Index />
</template>

<style lang="scss"></style>
