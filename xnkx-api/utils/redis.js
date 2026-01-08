const { createClient } = require('redis');

// 创建Redis客户端（适配4.x+版本）
const client = createClient({
    url: 'redis://127.0.0.1:6379', // Redis连接地址（默认端口6379）
    password: '', // Redis密码（无则留空）
    database: 0 // 数据库编号
});

// 监听Redis连接错误
client.on('error', (err) => {
    console.error('Redis连接失败：', err);
});

// 监听Redis连接成功
client.on('connect', () => {
    console.log('Redis连接成功');
});

// 立即连接Redis（4.x+必须显式调用connect）
(async () => {
    await client.connect().catch(err => console.error('Redis连接异常：', err));
})();

// 封装Redis操作（4.x+原生Promise，无需promisify）
const redisClient = {
    // 获取值
    get: async (key) => {
        try {
            return await client.get(key);
        } catch (err) {
            console.error(`Redis GET ${key} 失败：`, err);
            return null;
        }
    },
    // 设置值
    set: async (key, value, expireSeconds) => {
        try {
            const result = await client.set(key, value);
            // 如果传入过期时间，设置过期
            if (expireSeconds) {
                await client.expire(key, expireSeconds);
            }
            return result;
        } catch (err) {
            console.error(`Redis SET ${key} 失败：`, err);
            return null;
        }
    },
    // 自增
    incr: async (key) => {
        try {
            return await client.incr(key);
        } catch (err) {
            console.error(`Redis INCR ${key} 失败：`, err);
            return 0;
        }
    },
    // Hash自增
    hincrby: async (hashKey, field, increment) => {
        try {
            return await client.hIncrBy(hashKey, field, increment);
        } catch (err) {
            console.error(`Redis HINCRBY ${hashKey}.${field} 失败：`, err);
            return 0;
        }
    },
    // 获取Hash所有字段
    hgetall: async (hashKey) => {
        try {
            return await client.hGetAll(hashKey);
        } catch (err) {
            console.error(`Redis HGETALL ${hashKey} 失败：`, err);
            return {};
        }
    },
    // 设置过期时间
    expire: async (key, seconds) => {
        try {
            return await client.expire(key, seconds);
        } catch (err) {
            console.error(`Redis EXPIRE ${key} 失败：`, err);
            return false;
        }
    },
    // 删除单个key
    del: async (key) => {
        try {
            return await client.del(key);
        } catch (err) {
            console.error(`Redis DEL ${key} 失败：`, err);
            return 0;
        }
    },
    // 删除匹配通配符的所有key
    delPattern: async (pattern) => {
        try {
            // 获取所有匹配的key
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                // 批量删除所有匹配的key
                return await client.del(keys);
            }
            return 0;
        } catch (err) {
            console.error(`Redis DEL ${pattern} 失败：`, err);
            return 0;
        }
    }
};

module.exports = redisClient;