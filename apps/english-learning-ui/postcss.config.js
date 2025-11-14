export default {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-preset-env': {
      features: {
        'custom-properties': true,
      },
    },
    autoprefixer: {},
  },
}
