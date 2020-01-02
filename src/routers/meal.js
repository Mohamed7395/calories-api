const express = require('express')
const Meal = require('../models/meal')
const auth = require('../middleware/auth')
const router = new express.Router

// Create meal list
router.post('/meals', auth, async (req, res) => {
    try {
        if (req.user.userType === 'manager') {
            throw new Error('Unauthorized')
        }
        const meal = new Meal({
            ...req.body,
            owner: req.user._id
        })
        const date = new Date(Date.now()).getHours()

        if (date >= 0 && date <= 11) {
            meal.mealType = 'breakfast'
        } else if (18 >= date && date >= 12) {
            meal.mealType = 'lunch'
        } else {
            meal.mealType = 'dinner'
        }

        await meal.save()
        res.status(201).send(meal)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})

// Read meals
// Get /meals?month=11
// GET /meals?time=launch
router.get('/meals', auth, async (req, res) => {
    try {
        const date = new Date(Date.now()).getDate()

        if (req.user.userType === 'manager') {
            throw new Error('Unauthorized')
        }

        await req.user.populate('meals').execPopulate()

        if (req.query.month) {
            let filteredArr = req.user.meals.filter((meal) => {
                return parseInt(req.query.month) === meal.createdAt.getMonth() + 1
            })
            if (req.query.time) {
                let timeArr = filteredArr.filter((meal) => {
                    return req.query.time === meal.mealType
                })
                req.user.meals = timeArr
            }

        }

        if (req.query.expected) {
            let calories = 0
            let filteredArr = req.user.meals.filter((meal) => {
                return meal.createdAt.getDate() == date 
            })

            filteredArr.forEach((meal) => {
                return calories += meal.calories 
            })
            
            if (calories >= parseInt(req.query.expected)) {
                return res.send({status: 'RED'})
            }

            res.send({status: 'GREEN'})
        }
        
        res.send(req.user.meals)
    } catch (e) {
    res.status(400).send({ error: e.message })
    }
})

// Read specific meal
router.get('/meals/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        if (req.user.userType === 'manager') {
            throw new Error('Unauthorized')
        }

        const meal = await Meal.findOne({ _id, owner: req.user._id })

        if (!meal) {
            return res.status(404).send()
        }
        res.send(meal)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})

router.patch('/meals/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['meal', 'calories']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        if (req.user.userType === 'manager') {
            throw new Error('Unauthorized')
        }

        const meal = await Meal.findOne({ _id: req.params.id, owner: req.user._id })
        if (!meal) {
            return res.status(404).send()
        }

        updates.forEach((update) => meal[update] = req.body[update])
        await meal.save()
        res.send(meal)
    } catch (e) {
        res.status(400).send({ error: e.message })
    }
})

// Delete meal
router.delete('/meals/:id', auth, async (req, res) => {
    try {
        if (req.user.userType === 'manager') {
            throw new Error('Unauthorized')
        }

        const meal = await Meal.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!meal) {
            throw new Error('No meal found!')
        }
        res.send(meal)
    } catch (e) {
        res.status(404).send({ error: e.message })
    }
})

module.exports = router