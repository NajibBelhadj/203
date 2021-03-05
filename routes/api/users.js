const express = require('express');
const router = express.Router();

// @Router   GET api/users/test
// @desc     Tests post route
// @access    Public
router.get('/test', (req, res) => res.json({msg: "users Works"}));

module.exports = router;