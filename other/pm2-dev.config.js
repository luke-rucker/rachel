module.exports = {
  apps: [
    {
      name: 'server',
      script: 'node ./index.js',
      watch: ['./index.js', './server/**/*.ts', './.env'],
    },
    {
      name: 'remix',
      script: 'remix watch',
      ignore_watch: ['.'],
    },
  ],
}
