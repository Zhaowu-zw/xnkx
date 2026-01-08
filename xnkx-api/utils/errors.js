//用于表示 “用户未通过身份验证”（比如未登录或 token 无效）。
class UnauthorizedError extends Error {
  constructor(message) {
        super(message);
        this.name = "UnauthorizedError";
    }
}
//用于表示 “客户端提交的数据有问题”（比如参数错误、格式错误）。
class BadRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BadRequestError';
    }
}
//用于表示 “请求的资源不存在”。
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundError";
    }
}

module.exports = {
    UnauthorizedError,
    NotFoundError,
    BadRequestError
};