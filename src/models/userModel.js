const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const SALT_ROUNDS = 8

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    name: { type: String, default: '--' },
    isVerified: { type: Boolean, default: false },
    authToken: {
      type: String,
      default: ''
    },
    hashedPassword: {
      type: String
    },
    salt: {
      type: String,
      default: ''
    },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
)

UserSchema.methods = {
  makeSalt: () => bcrypt.genSaltSync(SALT_ROUNDS),

  encryptPassword: function (password) {
    if (!password) return ''
    return bcrypt.hashSync(password, this.salt)
  },

  authenticate: function (plainText) {
    return bcrypt.compareSync(plainText, this.hashedPassword)
  }
}

UserSchema.virtual('password')
  .set(function (password) {
    this._password = password
    this.salt = this.makeSalt()
    this.hashedPassword = this.encryptPassword(password)
  })

  .get(function () {
    return this._password
  })

UserSchema.statics = {
  getUserById: async function (id) {
    const query = { _id: id }
    const options = {
      criteria: query
    }
    return this.load(options)
  },

  getUserByEmail: async function (email) {
    const query = { email }
    const options = {
      criteria: query
    }
    return this.load(options)
  },

  resetOtp: async function (otp, phone, country) {
    return await this.findOneAndUpdate(
      { phone: phone, country: country },
      {
        $set: {
          otp: otp
        }
      },
      { new: true }
    )
  },

  verifyOtp: async function (otp, phone, country) {
    return await this.findOneAndUpdate(
      { phone: phone, country: country, otp: otp, isVerified: false },
      {
        $set: {
          otp: 0,
          isVerified: true
        }
      },
      { new: true }
    )
  },

  authUserByEmail: async function (email) {
    const query = { email, isActive: true }
    const options = {
      criteria: query,
      select: 'email hashedPassword name isActive isEmailVerified'
    }
    return this.load(options)
  },

  load: function (options, cb) {
    options.select = options.select || 'email name'
    return this.findOne(options.criteria).select(options.select).exec(cb)
  },

  list: function (options) {
    const criteria = options.criteria || {}
    const page = options.page - 1
    const limit = parseInt(options.limit) || 12
    const select = options.select || 'email name createdAt -__v'
    return this.find(criteria)
      .select(select)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec()
  }
}

UserSchema.index(
  {
    phone: 1,
    country: 1
  },
  { unique: true }
)

module.exports = mongoose.model('User', UserSchema)
