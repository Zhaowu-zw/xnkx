const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('./errors'); // 引入自定义错误类

/**
 * JWT 验证中间件
 * 作用：验证请求头中的 Token，解析用户信息并挂载到 req.user
 */
const authMiddleware = (req, res, next) => {
    try {
        // 1. 从请求头获取 Token（格式：Authorization: Bearer <token>）
        const authHeader = req.headers.authorization;
        if (!authHeader ) {
            // 没有 Token 或格式错误
            throw new UnauthorizedError('未提供有效的身份令牌，请先登录');
        }

        // 2. 提取 Token（去掉 "Bearer " 前缀）
        // const token = authHeader.split(' ')[1];
        // if (!token) {
        //     throw new UnauthorizedError('令牌格式错误，请重新登录');
        // }

        // 3. 验证并解析 Token（使用签名密钥，与生成 Token 时一致）
        const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
        // 注意：process.env.JWT_SECRET 需要在环境变量中配置（如 .env 文件）

        // 4. 将解析的用户信息挂载到 req 对象，供后续接口使用
        // 通常包含 userId、username 等非敏感信息（避免放密码等敏感数据）
        req.user = {
            userId: decoded.userId, // 从 Token 中提取用户 ID
            // username: decoded.username // 可选：提取用户名
            // 可根据需要添加其他信息（如角色、权限等）
        };

        // 5. 验证通过，继续执行后续接口逻辑
        next();
    } catch (error) {
        // 处理 Token 相关错误
        if (error.name === 'JsonWebTokenError') {
            // Token 无效（如篡改、签名错误）
            return res.status(401).json({ message: '无效的令牌，请重新登录' });
        }
        if (error.name === 'TokenExpiredError') {
            // Token 过期
            return res.status(401).json({ message: '令牌已过期，请重新登录' });
        }
        // 其他错误（如自定义的 UnauthorizedError）
        return res.status(401).json({ message: error.message || '身份验证失败' });
    }
};

module.exports = authMiddleware;