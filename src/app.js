require('dotenv').config()
// Require external modules
const path = require('path')
const autoload = require('@fastify/autoload')
const swagger = require('@fastify/swagger')
const swaggerUI = require('@fastify/swagger-ui')

const Etag = require('@fastify/etag')
const cors = require('@fastify/cors')

// Import Swagger Options
const swaggerConf = require('@configs/swagger')

module.exports = (fastify, opts, next) => {
  fastify.register(cors, {
    origin: true,
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'x-project',
      'x-admin-key'
    ],
    credentials: true,
    maxAge: 8400,
    preflightContinue: true
  })
  // Register swagger
  fastify.register(swagger, swaggerConf.options)
  fastify.register(swaggerUI, {
    routePrefix: swaggerConf.options.routePrefix,
    exposeRoute: swaggerConf.options.exposeRoute
  })
  fastify.register(Etag)

  fastify.register(Etag)

  fastify.register(autoload, {
    dir: path.join(__dirname, 'plugins')
  })
  fastify.register(autoload, {
    dir: path.join(__dirname, 'services/v1/'),
    options: Object.assign({ prefix: '/v1' }, opts)
  })

  next()
}
