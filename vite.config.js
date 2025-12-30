import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCss from 'unocss/vite'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 3000
    },
    base: './',
    build: {
        outDir: 'docs'
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use "@/assets/css/var.scss" as *;`,
            }
        }
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
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
        Components({
            resolvers: [
                ElementPlusResolver({
                    importStyle: 'sass'
                })
            ]
        })
    ],
})
