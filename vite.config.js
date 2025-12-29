import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCss from 'unocss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    build: {
        outDir: 'docs'
    },
    server: {
        host: '0.0.0.0',
        port: 3000
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    plugins: [
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false,

            pwaAssets: {
                disabled: false,
                config: true,
            },

            manifest: {
                name: '米米记录',
                short_name: '米米记录',
                description: '一款离线且免费的记录软件',
                theme_color: '#ffffff',
            },

            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
            },

            devOptions: {
                enabled: true,
                navigateFallback: 'index.html',
                suppressWarnings: true,
                type: 'module',
            },
        }),
        UnoCss({
            configFile: './uno.config.js'
        }),
    ],
})
