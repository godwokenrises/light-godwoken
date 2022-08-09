export const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

/**
 * @param waitBlock
 * @param blockProduceTime unit is milliseconds
 * @returns
 */
export const getEstimateWaitTime = (waitBlock: number, blockProduceTime: number): string => {
  const waitSeconds = (waitBlock * blockProduceTime) / 1000;
  const secondsPerMinute = 60;
  const secondsPerHour = 3600;
  const secondsPerday = 86400;
  if (waitSeconds < secondsPerHour) {
    return `${Math.round(waitSeconds / secondsPerMinute)} minutes`;
  } else if (waitSeconds >= secondsPerHour && waitSeconds < secondsPerday) {
    return `${Math.round(waitSeconds / secondsPerHour)} hours`;
  } else if (waitSeconds >= secondsPerday) {
    return `${Math.round(waitSeconds / secondsPerday)} days`;
  } else {
    return "unkonwn time";
  }
};
