const mongoose = require('mongoose')

const mealSchema = new mongoose.Schema ({
    meal: {
        type: String,
        required: true,
        trim: true
    },
    calories: {
        type: Number,
        required: true
    },
    mealType: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

const Meal = mongoose.model('Meal', mealSchema)

module.exports = Meal