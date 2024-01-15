import React, { useEffect, useState, useContext, useRef } from "react";
import { fetchCoordinatesFromZipcode } from "../../utils/fetchCoordinatesFromZipcode";

import { firebaseApp } from "../../firebase";
import {
  collection,
  getFirestore,
  setDoc,
  doc,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { authContext } from "../../App";
import axios from "axios";

const MapRenderer = () => {
  const API_URL = "http://localhost:5000/api";
  const db = getFirestore(firebaseApp);
  const [map, setMap] = useState<any | null>(null);
  const [startZip, setStartZip] = useState("51023");
  const [endZip, setEndZip] = useState("51001");
  const [message, setMessage] = useState("");
  const { state } = useContext(authContext);
  const { userId } = state;

  useEffect(() => {
    const fetchSavedZipCodes = async () => {
      if (!userId) {
        console.log("Please log retrive saved zip codes");
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/map/${userId}`);
        console.log("RESPONSE: ", response?.data);

        if (response?.data?.success) {
          const { endZip, startZip } = response?.data?.data;

          setStartZip(startZip);
          setEndZip(endZip);
          findRoute(startZip, endZip);
          return;
        }
      } catch (error) {
        console.log("There was an error while trying to save zipcodes", error);
      }
    };
    fetchSavedZipCodes();
  }, [userId]);

  useEffect(() => {
    const mapElement = document.getElementById("map") as HTMLElement;

    const newMap = new window.google.maps.Map(mapElement, {
      center: { lat: 0, lng: 0 },
      zoom: 12,
    });

    setMap(newMap);
    findRoute(startZip, endZip);
  }, [startZip, endZip]);

  const findRoute = async (sourceZip: string, destinationZip: string) => {
    const startLocation = await fetchCoordinatesFromZipcode(sourceZip);
    const endLocation = await fetchCoordinatesFromZipcode(destinationZip);
    if (!startLocation || !endLocation) {
      setMessage("Provided zip codes are invalid");
      return;
    }

    // @ts-ignore
    const directionsService = new window.google.maps.DirectionsService();

    try {
      directionsService.route(
        {
          origin: {
            lat: startLocation?.latitude,
            lng: startLocation?.longitude,
          },
          destination: {
            lat: endLocation?.latitude,
            lng: endLocation?.longitude,
          },
          // @ts-ignore
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result: any, status: string) => {
          if (status === "OK") {
            // @ts-ignore
            const directionsDisplay = new window.google.maps.DirectionsRenderer(
              {
                map,
              }
            );
            directionsDisplay.setDirections(result);
            map?.addListener("click", (e: any) => {
              handleMapClick(e.latLng, result);
            });
          } else {
            console.error(`Directions request failed due to ${status}`);
          }
        }
      );
    } catch (error) {
      console.log("Failed to fetch route", error);
    }
  };

  const saveZipCodesInDb = async () => {
    if (!userId) {
      setMessage("Please log in to save zip codes");
      return;
    }

    if (!startZip || !endZip) {
      setMessage("Please enter both zip codes");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/map/`, {
        userId,
        startZip,
        endZip,
      });

      console.log("RESPONSE: ", response?.data);

      if (response?.data?.success) {
        setMessage("");
        return;
      }
    } catch (error) {
      setMessage("Failed to save zip codes.");
      console.log("There was an error while trying to save zip codes", error);
    }
  };

  const handleMapClick = (clickedPoint: any, routeResult: any) => {
    const startPoint = {
      lat: clickedPoint.lat(),
      lng: clickedPoint.lng(),
    };

    // @ts-ignore
    const decodedPath = google.maps.geometry.encoding.decodePath(
      routeResult?.routes?.[0].overview_polyline
    );

    let nearestPoint = decodedPath[0];
    // @ts-ignore
    let minDistance = google.maps.geometry.spherical.computeDistanceBetween(
      startPoint,
      nearestPoint
    );

    for (const coord of decodedPath) {
      // @ts-ignore
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        startPoint,
        coord
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = coord;
      }
    }
    // @ts-ignore
    const directionsService = new google.maps.DirectionsService();

    const request = {
      origin: startPoint,
      destination: nearestPoint,
      // @ts-ignore
      travelMode: google.maps.TravelMode.DRIVING,
    };
    // @ts-ignore
    directionsService.route(request, (result, status) => {
      // @ts-ignore
      if (status === google.maps.DirectionsStatus.OK) {
        const shortestPath = result?.routes[0].overview_path;
        // @ts-ignore
        const directionsDisplay = new window.google.maps.DirectionsRenderer({
          map,
        });
        directionsDisplay.setDirections(result);
      } else {
        console.error("Error fetching directions:", status);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (startZip.length !== 5 || endZip.length !== 5) {
      setMessage("Please enter valid zip codes.");
      return;
    }

    findRoute(startZip, endZip);
  };

  return (
    <div className="maps">
      <form className="maps__form form" onSubmit={(e) => handleSubmit(e)}>
        <div className="form__input-label-container">
          <label htmlFor="startZip" className="form__label">
            Start Zip Code:
          </label>
          <input
            className="form__input"
            type="text"
            id="startZip"
            value={startZip}
            onChange={(e) => setStartZip(e.target.value)}
          />
        </div>
        <div className="form__input-label-container">
          <label htmlFor="endZip" className="form__label">
            End Zip Code:
          </label>
          <input
            className="form__input"
            type="text"
            id="endZip"
            value={endZip}
            onChange={(e) => setEndZip(e.target.value)}
          />
        </div>
        <button type="submit" className="form__submit-button">
          Find Route
        </button>
        <button
          type="button"
          className="form__submit-button"
          onClick={saveZipCodesInDb}
        >
          Save Zip codes
        </button>
        <p
          className={`form__feedback ${
            message ? "form__feedback--visible" : ""
          }`}
        >
          {message}
        </p>
      </form>
    </div>
  );
};

export default MapRenderer;
