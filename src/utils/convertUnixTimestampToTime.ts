export const convertUnixTimestampToTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = `0${date.getMinutes()}`.slice(-2);
  const seconds = `0${date.getSeconds()}`.slice(-2);

  const period = hours >= 12 ? 'PM' : 'AM';

  const hours12 = hours % 12 || 12;

  return `${hours12}:${minutes}:${seconds} ${period}`;
};
