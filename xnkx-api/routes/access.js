const express = require('express');
const router = express.Router();
const { reportAccess, getAllStat } = require('../router_handler/access.js');


//访问量埋点接口
router.post('/access/report', reportAccess);

// 统计聚合接口
router.get('/statistics/all', getAllStat);

module.exports=router 