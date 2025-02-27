/**
 * 格式化时间戳为可读日期
 * @param timestamp 时间戳（毫秒）
 * @returns 格式化后的日期字符串
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 获取相对时间描述
 * @param timestamp 时间戳（毫秒）
 * @returns 相对时间描述
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  // 不到1分钟
  if (diff < 60 * 1000) {
    return "刚刚";
  }

  // 不到1小时
  if (diff < 3600 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }

  // 不到1天
  if (diff < 24 * 3600 * 1000) {
    const hours = Math.floor(diff / (3600 * 1000));
    return `${hours}小时前`;
  }

  // 不到1周
  if (diff < 7 * 24 * 3600 * 1000) {
    const days = Math.floor(diff / (24 * 3600 * 1000));
    return `${days}天前`;
  }

  // 其他情况返回具体日期
  return formatDate(timestamp);
}
