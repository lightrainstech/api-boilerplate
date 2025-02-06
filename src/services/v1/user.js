'use strict'

const User = require('@models/userModel.js')
const userPayload = require('@payloads/userPayload.js')
const EXPIRES_IN = process.env.JWT_TOKEN_EXPIRY || '14d'

module.exports = async function (fastify, opts) {
  fastify.post(
    '/signup',
    { schema: userPayload.otpSchema },
    async function (request, reply) {
      try {
        const {
          name,
          email,
          password,
          emTyped = email.toLowerCase().trim()
        } = request.body

        const user = await User.getUserByEmail(emTyped)

        if (user) {
          throw {
            statusCode: 409,
            message: 'User already exists, please login.'
          }
        }

        const newUser = await User.create({
          name,
          email: emTyped,
          password: password
        })

        const accessToken = await fastify.jwt.sign(
          {
            userId: newUser._id,
            isVerified: newUser.isVerified
          },
          { expiresIn: EXPIRES_IN }
        )

        return reply
          .headers({
            authorization: accessToken
          })
          .setCookie('token', accessToken, {
            httpOnly: true,
            sameSite: true,
            overwrite: true
          })
          .success(
            { accessToken }, // Data object
            {
              message:
                'An email has been sent to you with instructions on how to verify your email address.'
            }
          )
      } catch (error) {
        return reply.error({
          statusCode: error.statusCode || 500,
          message: error.message || 'An error occurred during signup'
        })
      }
    }
  )

  fastify.post(
    '/login',
    { schema: userPayload.loginSchema },
    async function (request, reply) {
      const {
        email,
        emTyped = email.toString().toLowerCase(),
        password
      } = request.body

      const user = await User.authUserByEmail(emTyped)

      console.log(user)

      if (user === null || user.email !== emTyped) {
        reply.error({
          message: 'Invalid email or password, please retry!'
        })
      } else {
        let isLoggedIn = await user.authenticate(password)
        if (isLoggedIn) {
          const jwt = fastify.jwt.sign(
            {
              userId: user._id
            },
            {
              expiresIn: EXPIRES_IN,
              sub: user._id.toString()
            }
          )
          reply
            .headers({
              authorization: jwt
            })
            .setCookie('token', jwt, {
              path: '/',
              httpOnly: true,
              sameSite: true,
              overwrite: true
            })

          reply.success({ user })
        } else {
          reply.error({
            message: 'Invalid email or password, please retry!'
          })
        }
      }
      return reply
    }
  )

  fastify.get(
    '/me',
    { schema: userPayload.getMeSchema, onRequest: fastify.authenticate },
    async function (request, reply) {
      const { userId } = request.user
      let user = await User.getUserById(userId)
      return reply.success({ user }, { message: 'Success' })
    }
  )
}

module.exports.autoPrefix = '/user'
