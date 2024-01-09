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

const Weather = () => {
  const [weatherData, setWeatherData] = useState<WeatherByDateType[] | null>(
    null
  );
  const [units, setUnits] = useState('metric');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const DEFAULT_LATITUDE = 33.6560128;
  const DEFAULT_LONGTITUDE = 72.9710592;
  const db = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  const userId = auth?.currentUser?.uid;

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        let latitude = DEFAULT_LATITUDE;
        let longitude = DEFAULT_LONGTITUDE;

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              latitude = position.coords.latitude;
              longitude = position.coords.longitude;
            },
            (error) => {
              console.error('Error getting user location:', error.message);
              setMessage(
                'Please enable location to get location based weather data.'
              );
            }
          );
        } else {
          console.error('Geolocation is not supported by this browser.');
        }

        const URL = `https://api.openweathermap.org/data/2.5/forecast?id=524901&units=${units}&lat=${latitude}&lon=${longitude}&appid=0d4cec26333efc0b4b16b99e0e60b21c`;

        const response = await axios.get(URL);
        const organizedData: any = {};

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
      } catch (error) {
        console.log(
          'There was in issue while fetching weather data: ',
          weatherData
        );
        setMessage('Failed to retrive weather data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [units]);

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
