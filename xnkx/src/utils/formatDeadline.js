// 格式化ISO时间为"YYYY-MM-DD"
 export const formatDeadline = (isoTime) => {
    if (!isoTime) return "";
    return new Date(isoTime).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
};