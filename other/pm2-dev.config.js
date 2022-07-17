module.exports = {
  apps: [
    {
      name: 'server',
      script: 'node ./index.js',
      watch: [
        './index.js',
        './server/**/*.ts',
        './config/default.yml',
        './config/development.yml',
        './.env',
      ],
    },
    {
      name: 'remix',
      script: 'remix watch',
      ignore_watch: ['.'],
    },
  ],
}
