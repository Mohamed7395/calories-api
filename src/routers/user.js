const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')

const router = new express.Router()

// Create user
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    const allowedUserType = ['admin', 'manager', 'regular']
    const isvalidUserType = allowedUserType.find((userType) => userType === req.body.userType)

    try {
        if (!isvalidUserType) {
            throw new Error('Invalid user type!')
        }

        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send({ error: e.message })
    }
})

// Login user
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({ user, token })
        console.log(user.createdAt.getMonth());
        
    } catch (e) {
        res.status(400).send({ error: e.message })
    }
})

// Logout user
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})

// Logout user from all sessions
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})

// Read user
router.get('/users/:id', auth, async (req, res) => {
    res.send(req.user)
})

// Read all usersq
router.get('/users', auth, async (req, res) => {
    try {
        if (req.user.userType === 'regular') {
            throw new Error('Unauthorized')
        }
        const users = await User.find()
        res.send(users)
    } catch (e) {
        res.status(401).send({ error: e.message })
    }
})

// Update user
router.patch('/users/:id', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        const allowedUpdates = ['name', 'email', 'password', 'age']
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

        if (!isValidOperation) {
            return res.status(400).send({ error: 'Invalid updates' })
        }

        if (req.user.userType === 'regular') {
            throw new Error('Unauthorized')
        }

        const user = await User.findById(req.params.id)
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.send(user)
    } catch (e) {
        res.status(400).send({ error: e.message })
    }
})

// Delete user
router.delete('/users/me', auth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id)
        res.send(req.user)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})

// Delete user by ID
router.delete('/users/:id', auth, async (req, res) => {
    try {
        if (req.user.userType === 'regular') {
            throw new Error('Unauthorized')
        }

        const user = await User.findByIdAndDelete(req.params.id)
        res.send(user)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})

module.exports = router