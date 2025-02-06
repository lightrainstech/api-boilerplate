// api-boilerplate/src/utils/generatorResponse.js
const { version } = require('../../package.json')

const base = {
  response: {
    statusCode: 200,
    message: null,
    error: false,
    version: version || '0.0.1'
  },
  data: []
}

module.exports = (data, response) => {
  const baseT = { ...base }
  baseT.response = {
    ...base.response,
    ...response,
    statusCode: response.statusCode || 200
  }
  baseT.data = data || {}

  console.log('Generated Response:', baseT)
  return baseT
}
