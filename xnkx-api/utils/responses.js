//定义成功的方法
function success(res,message,data={},code=200){
    return res.status(code).json({
        status: true,
        message,
        data,
        code
    });
}

//定义失败的方法
function fail(res, error) {
    // 处理 Sequelize 验证错误
    if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => err.message);
        return res.status(400).json({
            status: false,
            message: '请求参数错误',
            errors
        });
    }
    // 处理自定义的错误类型
    if (error.name === "BadRequestError") {
        return res.status(400).json({
            status: false,
            message: '错误的请求',
            errors: [error.message]
        });
    }
    // 未授权错误
    if(error.name==="UnauthorizedError"){
        return  res.status(401).json({
            status: false,
            message: '未授权访问',
            errors: [error.message]
        });
    }
    // 资源未找到错误
    if(error.name==="NotFoundError"){
        return res.status(404).json({
            status: false,
            message: '资源未找到',
            errors: [error.message]
        });
    }
    // 禁止访问错误
    if(error.name==="ForbiddenError"){
        return res.status(403).json({
            status: false,
            message: '禁止访问',
            errors: [error.message]
        });
    }
    // 其他未处理的错误，返回500服务器错误
    return res.status(500).json({
        status: false,
        message: '服务器内部错误',
        errors: [error.message || 'Internal Server Error']
    });
}
module.exports = {
    fail,success
};