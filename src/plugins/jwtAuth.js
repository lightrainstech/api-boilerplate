const fp = require('fastify-plugin')

async function validateToken(request, decodedToken) {
  return decodedToken.is2fa ? (decodedToken.is2faDone ? true : false) : true
}

// if 2fa
//   check is done
//     if done true
//     if not false
//   true

const myCustomMessages = {
  authorizationTokenUntrusted: 'Untrusted authorization token, 2FA is required'
}

module.exports = fp(async (fastify, opts) => {
  fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: false,
      overwrite: true
    },
    trusted: validateToken,
    messages: myCustomMessages
  })

  fastify.register(require('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET,
    hook: 'onRequest'
  })

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      return fastify.jwt.verify(request.cookies.token, async (err, decoded) => {
        if (err) {
          request.log.error('Token expired')
          reply.error('Token expired')
        } else {
          const today = new Date()
          const exp = new Date(today)
          const nowInEpoch = parseInt(exp.getTime() / 1000)
          if (decoded.exp <= nowInEpoch) {
            reply.send('Token expired')
            request.log.error('Token expired')
          }
          request.log.info('Token Valid')
          request.user = decoded
          return request
        }
      })
    } catch (err) {
      request.log.error('Unable to verify token', err)
      reply.send(err)
    }
  })
})
