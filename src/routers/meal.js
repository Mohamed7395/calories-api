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
// GET /meals?date=2019,12,28,2020,1,2,breakfast
// GET /meals?expected=300
router.get('/meals', auth, async (req, res) => {
    try {
        if (req.user.userType === 'manager') {
            throw new Error('Unauthorized')
        }

        await req.user.populate('meals').execPopulate()

        if (req.query.date) {
            let calories = 0
            const dateArr = req.query.date.split(',')
            const year1 = dateArr[0]
            const month1 = parseInt(dateArr[1]) - 1
            const day1 = dateArr[2]
            const year2 = dateArr[3]
            const month2 = parseInt(dateArr[4]) - 1
            const day2 = dateArr[5]
            const type = dateArr[6]

            const from = new Date(new Date().setFullYear(year1,month1,day1))
            const to = new Date(new Date().setFullYear(year2,month2,day2))

            const meals = req.user.meals.filter((meal) => {
                return meal.mealType === type && to > meal.createdAt && from <= meal.createdAt
            })

            meals.forEach((meal) => {
                return calories += meal.calories
            })
            return res.send({ calories })

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
                return res.send({ status: 'RED' })
            }

            res.send({ status: 'GREEN' })
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