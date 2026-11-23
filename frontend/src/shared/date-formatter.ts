import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export const formatDate = (date: Date | string) => {
  return dayjs(date).fromNow();
};

export const formatAbsoluteDate = (date: Date | string) => {
  return dayjs(date).format("MMM D, YYYY");
};