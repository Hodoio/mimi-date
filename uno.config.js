import {
    defineConfig,
    presetAttributify,
    presetIcons,
    presetTypography,
    presetWind3,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss'

export default defineConfig({
    presets: [
        presetAttributify(),
        presetIcons(),
        presetTypography(),
        presetWind3(),
    ],
    transformers: [
        transformerDirectives(),
        transformerVariantGroup()
    ],
})
