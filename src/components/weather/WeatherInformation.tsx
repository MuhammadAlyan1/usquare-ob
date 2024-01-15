import React from "react";
import { WeatherByDateType } from "../../types/weather";
import { convertHoursTo12HourFormat } from "../../utils/convertHoursTo12HourFormat";

type WeatherInformationPropsType = {
  weatherData: WeatherByDateType[] | null;
  selectedDate: string;
  units: string;
};

const WeatherInformation: React.FC<WeatherInformationPropsType> = ({
  weatherData,
  selectedDate,
  units,
}) => {
  // @ts-ignore

  const displayDetailedWeather = (data: any) => {
    if (!data) return;
    return (
      <div className="information__detailed">
        <div className="information__detailed-contents">
          <p className="information__detailed-current">{`${data.main.temp} ${
            units === "metric" ? "°C" : "°F"
          }`}</p>
          <p className="information__detailed-feels-like">{`Feels like ${
            data.main.feels_like
          } ${units === "metric" ? "°C" : "°F"}`}</p>
        </div>
        <div className="information__detailed-image-container">
          <img
            className="information__detailed-image"
            src={`http://openweathermap.org/img/w/${data?.weather[0]?.icon}.png`}
            alt="current weather icon"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="information">
      {/* @ts-ignore */}
      {weatherData && displayDetailedWeather(weatherData[selectedDate][0])}
      <ul className="information__temperatures">
        {weatherData &&
          // @ts-ignore
          weatherData[selectedDate].map((data: WeatherDataPointType, index) => (
            <li key={data.dt_txt} className="information__temperature">
              {` ${data.main.temp} ${units === "metric" ? "°C" : "°F"}`}

              <span className="information__weather">
                {
                  // @ts-ignore
                  data.weather[0]["main"]
                }
              </span>
              <img
                src={`http://openweathermap.org/img/w/${data?.weather[0]?.icon}.png`}
                alt=""
                className="information__weather-icon"
              />
              <span className="information__temperature-hour">
                {convertHoursTo12HourFormat(data.dt_txt.split(" ")[1])}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default WeatherInformation;
