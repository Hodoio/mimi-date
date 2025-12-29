import { createStore } from 'vuex'

export default createStore({
    state() {
        return {
            isMobile: false,
            isLeftExpand: true,
            isSaved: false
        }
    },
    mutations: {
        changeIsMobile (state, isMobile) {
            state.isMobile = isMobile
        },
        changeIsLeftExpand (state) {
            state.isLeftExpand = !state.isLeftExpand
        },
        setIsLeftExpand (state, isLeftExpand) {
            state.isLeftExpand = isLeftExpand
        },
        changeIsSaved (state, isSaved) {
            state.isSaved = isSaved
        }
    }
})
