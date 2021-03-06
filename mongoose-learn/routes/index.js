const express = require('express');
const User = require('../Schemas/user');

const router = express.Router();

router.get('/', async (req, res, next)=> {
    try {
        const users = await User.find({});
        res.render('index', {users});
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;