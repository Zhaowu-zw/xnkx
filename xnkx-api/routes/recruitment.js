const express = require('express');
const router = express.Router();
const { viewAllRecruitments, createrecruitment, viewPersonalRecruitment} = require('../router_handler/recruitment');
const  checkPermission  = require('../utils/checkPermission');



/* GET recruitments listing. */
//查询所有纳新信息
router.get('/recruitment_views', checkPermission('recruitment:view'), viewAllRecruitments)
//查看报名信息
router.post('/recruitment_view', checkPermission('recruitment:view:own'), viewPersonalRecruitment);
//纳新报名
router.post('/recruitment_create', checkPermission('recruitment:create'), createrecruitment);
module.exports = router;