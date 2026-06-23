import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  cssVarsPrefix: 'ck',
  globalCss: {
    'html, body': {
      fontFamily: 'Poppins, sans-serif',
      bg: 'bg.subtle',
      color: 'fg',
    },
    '*::selection': {
      bg: 'brand.100',
    },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#eff6ff' },
          100: { value: '#dbeafe' },
          200: { value: '#bfdbfe' },
          300: { value: '#93c5fd' },
          400: { value: '#60a5fa' },
          500: { value: '#3b82f6' },
          600: { value: '#2563eb' },
          700: { value: '#1d4ed8' },
          800: { value: '#1e40af' },
          900: { value: '#1e3a8a' },
        },
      },
      fonts: {
        heading: { value: 'Poppins, sans-serif' },
        body: { value: 'Poppins, sans-serif' },
      },
      radii: {
        l1: { value: '0.5rem' },
        l2: { value: '0.75rem' },
        l3: { value: '1rem' },
      },
    },
    semanticTokens: {
      colors: {
        // Map Chakra's `colorPalette="brand"` onto the brand scale + a default accent.
        brand: {
          solid: { value: '{colors.brand.600}' },
          contrast: { value: 'white' },
          fg: { value: { base: '{colors.brand.700}', _dark: '{colors.brand.300}' } },
          muted: { value: { base: '{colors.brand.100}', _dark: '{colors.brand.900}' } },
          subtle: { value: { base: '{colors.brand.50}', _dark: '{colors.brand.950}' } },
          emphasized: { value: '{colors.brand.700}' },
          focusRing: { value: '{colors.brand.500}' },
        },
        success: { value: { base: '{colors.green.500}', _dark: '{colors.green.400}' } },
        warning: { value: { base: '{colors.orange.500}', _dark: '{colors.orange.400}' } },
        error: { value: { base: '{colors.red.500}', _dark: '{colors.red.400}' } },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
export default system;
