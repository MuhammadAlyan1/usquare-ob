export const convertHoursTo12HourFormat = (time: string): string => {
  const hours = Number(time.split(':')[0]);

  const period = hours >= 12 ? 'PM' : 'AM';

  const hours12 = hours % 12 || 12;

  return `${hours12} ${period}`;
};
