'use strict'
const S = require('fluent-json-schema')

// Common schema components for reuse
const commonFields = {
  phone: S.string()
    .pattern('^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$')
    .description('Phone number in international format'),

  country: S.string()
    .minLength(2)
    .maxLength(2)
    .pattern('^[A-Z]{2}$')
    .description('ISO 3166-1 alpha-2 country code'),

  email: S.string().format(S.FORMATS.EMAIL).description('Valid email address'),

  name: S.string()
    .minLength(2)
    .maxLength(50)
    .pattern('^[a-zA-Z ]*$')
    .description('User full name'),

  otp: S.string().pattern('^[0-9]{4}$').description('4-digit OTP code'),

  password: S.string()
    .minLength(8)
    .pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])')
    .description(
      'Password must contain at least 8 characters, including uppercase, lowercase, number and special character'
    )
}

// Response schemas

const responses = {
  success: S.object()
    .prop(
      'response',
      S.object()
        .prop('statusCode', S.number().default(200))
        .prop('message', S.string().default('Success'))
        .prop('error', S.boolean().default(false))
        .prop('version', S.string().default('0.1.0'))
    )
    .prop('data', S.object()),

  error: S.object()
    .prop(
      'response',
      S.object()
        .prop('statusCode', S.number().default(400))
        .prop('message', S.string())
        .prop('error', S.boolean().default(true))
        .prop('version', S.string().default('0.1.0'))
    )
    .prop('data', S.array().default([]))
}

exports.otpSchema = {
  tags: ['User'],
  summary: 'User sign up',
  description: 'Create a new user account and send verification OTP',
  body: S.object()
    .required(['name', 'email', 'password'])
    .prop('name', commonFields.name)
    .prop('email', commonFields.email)
    .prop('password', commonFields.password),
  response: {
    200: responses.success.prop('data', S.object().prop('otp', S.string())),
    400: responses.error,
    409: responses.error.description('User already exists')
  }
}

exports.getMeSchema = {
  tags: ['User'],
  summary: 'Get user profile',
  description: 'Get authenticated user profile details',
  security: [{ Bearer: [] }],
  response: {
    200: responses.success.prop(
      'data',
      S.object()
        .prop('name', S.string())
        .prop('email', S.string())
        .prop('phone', S.string())
        .prop('country', S.string())
        .prop('isVerified', S.boolean())
        .prop('isKycDone', S.boolean())
    ),
    401: responses.error.description('Unauthorized'),
    404: responses.error.description('User not found')
  }
}
