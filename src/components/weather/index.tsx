import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { WeatherByDateType, WeatherDataPointType } from '../../types/weather';
import Navigation from './Navigation';
import WeatherInformation from './WeatherInformation';
import {
  getFirestore,
  setDoc,
  getDoc,
  collection,
  doc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../../firebase';
import { convertUnixTimestampToTime } from '../../utils/convertUnixTimestampToTime';
import sunsetImage from '../../assets/weather/sunset.png';
import sunriseImage from '../../assets/weather/sunrise.png';

type CityType = {
  coords: {
    lat: number;
    lng: number;
  };
  name: string;
  country: string;
  id: number;
  population: number;
  sunrise: number;
  sunset: number;
  timezone: number;
};

const Weather = () => {
  const [weatherData, setWeatherData] = useState<WeatherByDateType[] | null>(
    null
  );
  const [units, setUnits] = useState('metric');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [userPreferredUnit, setUserPreferredUnit] = useState('');
  const [cityMetaData, setCityMetaData] = useState<CityType | null>(null);
  const DEFAULT_LATITUDE = 33.6560128;
  const DEFAULT_LONGTITUDE = 72.9710592;
  const [coordinates, setCoordinates] = useState({
    lat: DEFAULT_LATITUDE,
    lng: DEFAULT_LONGTITUDE
  });
  const db = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  const userId = auth?.currentUser?.uid;

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCoordinates({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });

              fetchData(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
              console.error('Error getting user location:', error.message);
              setMessage(
                'Please enable location to get location-based weather data.'
              );
              setIsLoading(false);
            }
          );
        } else {
          console.error('Geolocation is not supported by this browser.');
          fetchData(coordinates?.lat, coordinates.lng);
        }
      } catch (error) {
        console.log('There was an issue while fetching weather data:', error);
        setMessage('Failed to retrieve weather data.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchData = async (latitude: number, longitude: number) => {
      const URL = `https://api.openweathermap.org/data/2.5/forecast?id=524901&units=${units}&lat=${latitude}&lon=${longitude}&appid=0d4cec26333efc0b4b16b99e0e60b21c`;

      const response = await axios.get(URL);
      const organizedData: any = {};
      setCityMetaData(response?.data?.city);
      response?.data?.list?.forEach((item: WeatherDataPointType) => {
        const date = item.dt_txt.split(' ')[0];

        if (!organizedData[date]) {
          organizedData[date] = [];
        }

        organizedData[date].push({
          ...item
        });
      });

      setWeatherData(organizedData);
      !selectedDate && setSelectedDate(Object.keys(organizedData)[0]);
    };

    fetchWeather();
  }, [units, coordinates?.lat, coordinates?.lng]);

  useEffect(() => {
    const fetchUserPrefences = async (): Promise<void> => {
      if (!userId) {
        return;
      }

      try {
        setIsLoading(true);
        const userPreferencesRef = doc(db, 'preferences', userId);
        const userPreferencesSnapshot = await getDoc(userPreferencesRef);

        if (userPreferencesSnapshot.exists()) {
          const userPreferenesData = userPreferencesSnapshot.data();
          userPreferenesData?.units && setUnits(userPreferenesData.units);
          setUserPreferredUnit(units);
        }
      } catch (error: any) {
        console.log('error');
        setMessage(error?.code);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPrefences();
  }, [userId]);

  const handleChangeUnits = () => {
    setUnits((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
  };

  const setUserPrefences = async (): Promise<void> => {
    if (!userId) {
      setMessage('Please sign in to set preferences.');
      return;
    }

    try {
      setIsLoading(true);
      const preferencesCollection = collection(db, 'preferences');
      await setDoc(doc(preferencesCollection, userId), {
        userId,
        units
      });
      setUserPreferredUnit(units);
    } catch (error: any) {
      console.log('error');
      setMessage(error?.code);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="weather">
      <h1 className="weather__heading">weather</h1>
      <div className="weather__container">
        {
          <p
            className={`weather__loading ${
              isLoading ? 'weather__loading--visible' : ''
            }`}
          >
            Loading..
          </p>
        }
        {message && <p className="weather__message">{message}</p>}

        {cityMetaData && (
          <p className="weather__city">{`${cityMetaData?.name}, ${cityMetaData?.country} `}</p>
        )}

        {cityMetaData && (
          <>
            <div className="weather__day-duration">
              <img
                src={sunriseImage}
                alt="sunrise"
                className="weather__day-duration-icon"
              />
              <p className="weather__duration">
                {cityMetaData &&
                  convertUnixTimestampToTime(cityMetaData?.sunrise)}
              </p>
            </div>
            <div className="weather__day-duration">
              <img
                src={sunsetImage}
                alt="sunset"
                className="weather__day-duration-icon"
              />

              <p className="weather__sunset">
                {cityMetaData &&
                  convertUnixTimestampToTime(cityMetaData?.sunset)}
              </p>
            </div>
          </>
        )}

        <div className="weather__user-actions">
          {units === 'metric' && (
            <button className="weather__button" onClick={handleChangeUnits}>
              Change to Fahrenheit
            </button>
          )}
          {units === 'imperial' && (
            <button className="weather__button" onClick={handleChangeUnits}>
              Change to Celsius
            </button>
          )}
          <button className="weather__button" onClick={setUserPrefences}>
            Save preferences
          </button>
        </div>
        <p className="weather__user-preferences">
          {userPreferredUnit
            ? `Your units preferences are set as ${userPreferredUnit}`
            : 'You do not have any preferences saved'}
        </p>
        {
          <Navigation
            weatherData={weatherData}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        }
        <WeatherInformation
          weatherData={weatherData}
          selectedDate={selectedDate}
          units={units}
        />
      </div>
    </div>
  );
};

export default Weather;
