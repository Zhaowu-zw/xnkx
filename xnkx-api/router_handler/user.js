const { Op } = require('sequelize');
const { user, userinfo ,user_role ,notice} = require('../models');
const { BadRequestError, NotFoundError,UnauthorizedError } = require('../utils/errors');
const { success, fail } = require('../utils/responses');
const bcrypt = require('bcryptjs');
const jwt =  require('jsonwebtoken');
const { generateCaptcha } = require('../utils/captcha');

// 临时存储验证码，实际项目中应该使用Redis或其他持久化存储
const captchaStore = new Map();

// 验证码有效期（毫秒）
const CAPTCHA_EXPIRY = 5 * 60 * 1000;

const regUser = async function (req, res) {
    try {   
        const { username, password, repassword, email, captcha, captchaId } = req.body;
        if(!username || !password || !repassword || !email || !captcha || !captchaId){
            throw new BadRequestError('请填写完整的注册信息');
        }
        
        // 验证验证码
        const storedCaptcha = captchaStore.get(captchaId);
        if (!storedCaptcha) {
            throw new BadRequestError('验证码已过期或无效');
        }
        
        if (storedCaptcha.captcha.toLowerCase() !== captcha.toLowerCase()) {
            throw new BadRequestError('验证码错误');
        }
        
        // 验证通过后删除验证码
        captchaStore.delete(captchaId);
        if(password !== repassword){
            throw new BadRequestError('两次输入的密码不一致');
        }
        // 检查用户名或邮箱是否已存在
        const condition = {
            where: {
                [Op.or]: [
                    { username: username },
                    { email: email }
                ]
            }
        }
        const existingUser = await user.findOne(condition);
        if (existingUser) {
            throw new BadRequestError('用户名或邮箱已存在');
        }

        await user.create({ username, password, email, userinfo: { sex: '未知' } }, { include: userinfo });
        //查询新创建的用户
        const newUser = await user.findOne({ where: { username: username } });
        const role_id = 6; // 默认角色 ID，例如普通用户
        await user_role.create({
            user_id: newUser.id, // 关联的用户 ID
            role_id: role_id     // 关联的角色 ID
        });
        success(res, '注册成功');
    } catch (error) {   
        fail(res,error);
    }

}

const loginUser = async function (req, res) {
    // 登录逻辑待实现
    try {
        const { login, password, captcha, captchaId } = req.body;
        if(!login){
            throw new BadRequestError('请输入用户名或邮箱或手机号');
        }
        if(!password){
            throw new BadRequestError('请输入密码');
        }
        if(!captcha || !captchaId){
            throw new BadRequestError('请输入验证码');
        }
        
        // 验证验证码
        const storedCaptcha = captchaStore.get(captchaId);
        if (!storedCaptcha) {
            throw new BadRequestError('验证码已过期或无效');
        }
        
        if (storedCaptcha.captcha.toLowerCase() !== captcha.toLowerCase()) {
            throw new BadRequestError('验证码错误');
        }
        
        // 验证通过后删除验证码
        captchaStore.delete(captchaId);
        const condition = {
            where: {
                [Op.or]: [
                    { username: login },
                    { email: login }
                ]
            }
        }
        const existingUser = await user.findOne(condition);
        if (!existingUser) {
            throw new NotFoundError('用户不存在');
        }
        const passwordMatch = bcrypt.compareSync(password, existingUser.password);
        if (!passwordMatch) {
            throw new UnauthorizedError('密码错误');
        }
        const token = jwt.sign({
           userId:existingUser.id
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
 
        success(res, '登录成功', { token, role_name: existingUser.role_name });
        await notice.create({
            notice_type: 'system',
            receiver_id: existingUser.id,
            content: '【小鸟快修社团】欢迎您的登录，已为你开放更多权限！快来加入我们吧！'
        })
    } catch (error) {
        fail(res,error);
    }
}
// 生成并返回验证码
const getCaptcha = async function (req, res) {
    try {
        const captcha = generateCaptcha();
        const captchaId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        // 存储验证码，包括过期时间
        captchaStore.set(captchaId, {
            captcha: captcha,
            expiresAt: Date.now() + CAPTCHA_EXPIRY
        });
        
        // 清理过期验证码
        for (const [id, data] of captchaStore.entries()) {
            if (data.expiresAt < Date.now()) {
                captchaStore.delete(id);
            }
        }
        
        success(res, '获取验证码成功', { captcha, captchaId });
    } catch (error) {
        fail(res, error);
    }
};

module.exports = {
    regUser,
    loginUser,
    getCaptcha
 }