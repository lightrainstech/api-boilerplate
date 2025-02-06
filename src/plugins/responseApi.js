'use strict'
require('dotenv').config()

const fp = require('fastify-plugin')
const generateResponse = require('../utils/generatorResponse')

module.exports = fp(
  async function (fastify, opts) {
    const PROCESSED = Symbol('processed')

    fastify.decorateReply('success', function (data = [], response = {}) {
      response.error = response.error || false
      response.message = response.message || 'Success'

      const finalResponse = generateResponse(data, response)
      finalResponse[PROCESSED] = true

      return this.code(200)
        .header('Content-Type', 'application/json')
        .serializer(payload => JSON.stringify(payload)) // Add custom serializer
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
        .serializer(payload => JSON.stringify(payload)) // Add custom serializer
        .send(finalResponse)
    })

    fastify.setErrorHandler(function (error, request, reply) {
      if (process.env.NODE_ENV != 'production') {
        console.log('APP ERROR: ', error)
      }

      let resp = {}
      if (error.validation) {
        resp = {
          error: true,
          statusCode: 422,
          message: `${error.validation[0].instancePath.slice(
            1
          )} ${error.validation[0].message
            .substring(0)
            .charAt(0)
            .toUpperCase()}${error.validation[0].message.substring(1)}`
        }
        reply.status(422).send(generateResponse([], resp))
      } else {
        resp = {
          error: true,
          statusCode: 401,
          message:
            'An error occurred while processing your request. We apologize for the inconvenience. Please try again later or contact our support team for assistance.'
        }
        reply.status(401).send(generateResponse([], resp))
      }
      // reply.status(400).send(generateResponse([], resp))
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
