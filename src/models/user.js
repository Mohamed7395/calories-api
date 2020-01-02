const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Meal = require('./meal')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        trim: true
    },
    email: {
        type: String,
        require: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        require: true,
        minlength: 8,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password must not contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be postive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            require: true
        }
    }],
    userType: {
        type: String,
        required: true,
        trim: true
        }
}, {
    timestamps: true
})

userSchema.virtual('meals', {
    ref: 'Meal',
    localField: '_id',
    foreignField: 'owner'
})

// Delete password and tokens from responce
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

// findByCredentials creation
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    
    if (!user) {
        throw new Error ('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error ('Unable to login')
    }
    
    return user
}

// hash plain-text password before saving
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Create Authintcation tokens
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    
    user.tokens.push({ token })
    await user.save()
    
    return token
}

const User = mongoose.model('User', userSchema)

module.exports = User