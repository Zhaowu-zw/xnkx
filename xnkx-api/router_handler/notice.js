const { Op } = require('sequelize');
const { notice ,user} = require('../models');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const { success, fail } = require('../utils/responses');


//查看通知（未读）
const viewNotices = async function (req, res) {
    try {
        const { userId } = req.user;
        const notices = await notice.findAll({
            where: {
                receiver_id: userId // 仍只查询当前用户的通知
            },
            // 排序规则：先按is_read升序（0在前，即未读在前），再按send_time降序（最新在前）
            order: [
                ['is_read', 'ASC'],   // 未读（0）排在已读（1）前面
                ['send_time', 'DESC'] // 同状态下，最新的通知排在前面
            ]
        });
        return success(res,'查询通知成功', notices);
    } catch (error) {
        console.error('查看通知失败:', error); // 补充错误日志打印
        fail(res, '查看通知失败');
    }
};
//标记已读
const markAsRead = async function (req, res) {
    try {
        const { id } = req.query; // 从URL参数获取单个通知ID
        const { userId } = req.user;
        let updatedCount;

        if (id) {
            // 有id时，更新指定通知
            const noticeToUpdate = await notice.findOne({
                where: {
                    id,
                    receiver_id: userId
                }
            });

            if (!noticeToUpdate) {
                return fail(res, '未找到该通知或无权限操作', 404);
            }

            noticeToUpdate.is_read = 1;
            await noticeToUpdate.save();
            updatedCount = 1; // 明确更新数量
        } else {
            // 无id时，更新当前用户所有未读通知
            const result = await notice.update(
                { is_read: 1 },
                {
                    where: {
                        receiver_id: userId,
                        is_read: 0 // 只更新未读的，避免重复操作
                    }
                }
            );
            updatedCount = result[0]; // update返回数组，第一个元素是更新的行数
        }

        return success(
            res,
            { updatedCount },
            id ? '通知标记为已读' : `成功标记${updatedCount}条未读通知为已读`
        );
    } catch (error) {
        console.error('标记通知为已读失败:', error);
        return fail(res, '标记通知为已读失败');
    }
};
//删除已读通知
const deleteReadNotices = async function (req, res) {
    try {
        const { userId } = req.user;
        const { id } = req.query;

        if (id) {
            // 删除单个已读通知
            const noticeToDelete = await notice.findOne({
                where: {
                    id,
                    receiver_id: userId,
                    is_read: 1 // 仅允许删除已读通知
                }
            });

            if (!noticeToDelete) {
                return fail(res, '未找到该已读通知或无权限操作', 404);
            }

            await noticeToDelete.destroy();
            return success(res, null, '单个已读通知删除成功');
        } else {
            // 删除当前用户所有已读通知
            const deleteResult = await notice.destroy({
                where: {
                    receiver_id: userId,
                    is_read: 1 // 仅删除已读状态的通知
                }
            });

            // 根据删除数量返回不同提示
            if (deleteResult === 0) {
                return success(res, null, '没有可删除的已读通知');
            }
            return success(res, null, `成功删除${deleteResult}条已读通知`);
        }

    } catch (error) {
        console.error('删除已读通知失败:', error);
        return fail(res, '删除已读通知失败');
    }
};

module.exports = {
    viewNotices,
    markAsRead,
    deleteReadNotices
};
