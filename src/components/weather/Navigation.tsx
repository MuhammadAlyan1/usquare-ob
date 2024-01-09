import React from 'react';
import { WeatherByDateType } from '../../types/weather';
import { getDayNameByDate } from '../../utils/getDayNameByDate';

type NavigationPropsType = {
  weatherData: WeatherByDateType[] | null;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
};

const Navigation: React.FC<NavigationPropsType> = ({
  weatherData,
  selectedDate,
  setSelectedDate
}) => {
  return (
    <ul className="navigation">
      {weatherData &&
        Object.keys(weatherData)?.map((date) => {
          return (
            <li
              key={date}
              className={`navigation__item ${
                selectedDate === date ? 'navigation__item--active' : ''
              }`}
              onClick={() => setSelectedDate(date)}
            >
              {getDayNameByDate(date)}
            </li>
          );
        })}
    </ul>
  );
};

export default Navigation;
