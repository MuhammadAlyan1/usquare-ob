import React, { useEffect, useState } from "react";
import axios from "axios";
import { WeatherByDateType, WeatherDataPointType } from "../../types/weather";

const Weather = () => {
  const [weatherData, setWeatherData] = useState<WeatherByDateType[] | null>(
    null
  );
  const [city, setCity] = useState("islamabad");
  const [units, setUnits] = useState("metric");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true);

        const URL = `https://api.openweathermap.org/data/2.5/forecast?id=524901&units=${units}&q=${city}&appid=0d4cec26333efc0b4b16b99e0e60b21c`;

        const response = await axios.get(URL);
        const organizedData: any = {};

        response?.data?.list?.forEach((item: WeatherDataPointType) => {
          const date = item.dt_txt.split(" ")[0];

          if (!organizedData[date]) {
            organizedData[date] = [];
          }

          organizedData[date].push({
            ...item,
          });
        });

        setWeatherData(organizedData);
        setMessage("");
      } catch (error) {
        console.log(
          "There was in issue while fetching weather data: ",
          weatherData
        );
        setMessage("Failed to retrive weather data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [units, city]);

  type ObjectEntriesType = [string, WeatherDataPointType[]];

  return (
    <div className="weather">
      <h1 className="weather__heading">weather</h1>
      {weatherData && (
        <div>
          {Object.entries(weatherData)?.map((data: any) => {
            console.log(data);

            return (
              <div>
                <h2 className="weather__date">{data[0]}</h2>
                <ul>
                  {data[1]?.map((dataPoint: WeatherDataPointType) => {
                    return (
                      <li>{`${dataPoint.dt_txt.split(" ")[1]} ${
                        dataPoint.main.temp
                      } ${units === "metric" ? "C" : "F"}`}</li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Weather;
