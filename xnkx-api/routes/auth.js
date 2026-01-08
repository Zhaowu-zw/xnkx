const express = require('express');
const router = express.Router();
const { regUser, loginUser, getCaptcha } = require('../router_handler/user');


/* GET users listing. */
//获取验证码
router.get('/captcha', getCaptcha);
//用户登录
router.post('/register', regUser);
router.post('/login', loginUser);

module.exports = router;
