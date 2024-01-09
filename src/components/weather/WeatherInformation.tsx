import React from 'react';
import { WeatherByDateType } from '../../types/weather';
import { convertHoursTo12HourFormat } from '../../utils/convertHoursTo12HourFormat';

type WeatherInformationPropsType = {
  weatherData: WeatherByDateType[] | null;
  selectedDate: string;
  units: string;
};

const WeatherInformation: React.FC<WeatherInformationPropsType> = ({
  weatherData,
  selectedDate,
  units
}) => {
  return (
    <div className="information">
      <ul className="information__temperatures">
        {weatherData &&
          // @ts-ignore
          weatherData[selectedDate].map((data: WeatherDataPointType) => (
            <li key={data.dt_txt} className="information__temperature">
              {` ${data.main.temp} ${units === 'metric' ? '°C' : '°F'}`}
              <span className="information__weather">
                {
                  // @ts-ignore
                  data.weather[0]['main']
                }
              </span>
              <span className="information__temperature-hour">
                {convertHoursTo12HourFormat(data.dt_txt.split(' ')[1])}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default WeatherInformation;
