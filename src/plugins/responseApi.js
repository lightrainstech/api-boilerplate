require('dotenv').config()

const fp = require('fastify-plugin')
const generateResponse = require('../utils/generatorResponse')

module.exports = fp(
  async fastify => {
    const PROCESSED = Symbol('processed')
    const jsonSerializer = payload => JSON.stringify(payload)

    fastify.decorateReply('success', function (data = [], response = {}) {
      response.error = response.error || false
      response.message = response.message || 'Success'

      const finalResponse = generateResponse(data, response)
      finalResponse[PROCESSED] = true

      return this.code(200)
        .header('Content-Type', 'application/json')
        .serializer(jsonSerializer)
        .send(finalResponse)
    })

    fastify.decorateReply('error', function (data = [], response = {}) {
      response.statusCode = response.statusCode || 400
      response.error = response.error || true
      response.message = response.message || 'Error'

      const finalResponse = generateResponse(data, response)
      finalResponse[PROCESSED] = true

      return this.code(response.statusCode)
        .header('Content-Type', 'application/json')
        .serializer(jsonSerializer)
        .send(finalResponse)
    })

    fastify.setErrorHandler((error, request, reply) => {
      if (process.env.NODE_ENV != 'production') {
        console.log('APP ERROR: ', error)
      }

      if (error.validation) {
        const validation = error.validation[0]
        const message =
          validation.message.charAt(0).toUpperCase() +
          validation.message.slice(1)
        const resp = {
          error: true,
          statusCode: 422,
          message: `${validation.instancePath.slice(1)} ${message}`
        }
        reply.status(422).send(generateResponse([], resp))
      } else {
        const resp = {
          error: true,
          statusCode: 401,
          message:
            'An error occurred while processing your request. We apologize for the inconvenience. Please try again later or contact our support team for assistance.'
        }
        reply.status(401).send(generateResponse([], resp))
      }
    })

    // Remove the preSerialization hook since we're using a custom serializer
    fastify.addHook('onSend', async (request, reply, payload) => {
      if (payload && typeof payload === 'string') {
        try {
          const parsed = JSON.parse(payload)
          if (parsed[PROCESSED]) {
            delete parsed[PROCESSED]
            return JSON.stringify(parsed)
          }
        } catch (e) {
          // Not JSON or already processed
          return payload
        }
      }
      return payload
    })
  },
  {
    name: 'responseApi',
    fastify: '>=4.0.0'
  }
)
