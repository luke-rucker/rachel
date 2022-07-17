import { createRequestHandler } from '@remix-run/express'
import compression from 'compression'
import express from 'express'
import path from 'path'
import requestLogger from 'pino-http'
import { logger } from './logger'

const app = express()

app.use(compression())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

// const buildAbsolutePath = here('../public/build')
app.use(
  '/build',
  express.static('public/build', { immutable: true, maxAge: '1y' })
)
app.use(express.static('public', { maxAge: '1h' }))

app.use(requestLogger({ logger }))

app.all(
  '*',
  process.env.NODE_ENV === 'development'
    ? (req, res, next) => {
        purgeRequireCache()

        return createRequestHandler({
          build: require('../build'),
          mode: process.env.NODE_ENV,
        })(req, res, next)
      }
    : createRequestHandler({
        build: require('../build'),
        mode: process.env.NODE_ENV,
      })
)

const port = process.env.PORT ?? 3000
app.listen(port, () => {
  // preload the build so we're ready for the first request
  // we want the server to start accepting requests asap, so we wait until now
  // to preload the build
  require('../build')
  logger.info(`listening on port ${port}`)
})

////////////////////////////////////////////////////////////////////////////////
const BUILD_DIR = path.join(process.cwd(), 'build')

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't const
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[key]
    }
  }
}
