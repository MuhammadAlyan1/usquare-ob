type DaysType = {
  [key: number]: string;
};

export const getDayNameByDate = (date: string): string => {
  const day = new Date(date).getDay();

  const days: DaysType = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };

  return days[day];
};
