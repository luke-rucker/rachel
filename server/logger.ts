import pino from 'pino'

const IS_PROD = process.env.NODE_ENV === 'production'

function buildLogger() {
  if (!IS_PROD) {
    return pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore:
            'pid,hostname,req.headers,res.headers,req.remoteAddress,req.remotePort',
        },
      },
      level: 'trace',
    })
  }

  return pino(
    pino.destination({
      // log messages are buffered before being written asynchronously
      // https://getpino.io/#/docs/asynchronous
      minLength: 4096,
      sync: false,
    })
  )
}

export const logger = buildLogger()
