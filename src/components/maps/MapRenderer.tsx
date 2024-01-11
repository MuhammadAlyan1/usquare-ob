import React, { useEffect, useState, useContext } from "react";
import { fetchCoordinatesFromZipcode } from "../../utils/fetchCoordinatesFromZipcode";

import { firebaseApp } from "../../firebase";
import { getAuth } from "firebase/auth";
import {
  collection,
  getFirestore,
  setDoc,
  doc,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { authContext } from "../../App";

const MapRenderer: React.FC<any> = ({
  map,
  startZip,
  setStartZip,
  endZip,
  setEndZip,
}) => {
  const [directions, setDirections] = useState(null);
  const db = getFirestore(firebaseApp);
  const [sourceZipcode, setSourceZipCode] = useState(startZip);
  const [destinationZipcode, setDestinationZipcode] = useState(endZip);
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
        const userZipcodeRef = doc(db, "maps", userId);
        const zipCodeSnapshot = await getDoc(userZipcodeRef);

        if (zipCodeSnapshot.exists()) {
          const zipCodesData = zipCodeSnapshot.data();
          setStartZip(zipCodesData.startZip);
          setEndZip(zipCodesData.endZip);

          console.log("SAVED ZIP CODES: ", zipCodesData);
          return;
        }
      } catch (error) {
        console.log("There was an error while trying to save zipcodes", error);
      }
    };
    fetchSavedZipCodes();
  }, []);

  const findRoute = async (sourceZip: string, destinationZip: string) => {
    const startLocation = await fetchCoordinatesFromZipcode(sourceZip);
    const endLocation = await fetchCoordinatesFromZipcode(destinationZip);

    if (!startLocation || !endLocation) {
      setMessage("Provided zip codes are invalid");
      return;
    }

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
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result: any, status: string) => {
          if (status === "OK") {
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

    if (!sourceZipcode || !destinationZipcode) {
      setMessage("Please enter both zip codes");
      return;
    }

    const mapsCollection = collection(db, "maps");
    try {
      await setDoc(doc(mapsCollection, userId), {
        userId,
        startZip: sourceZipcode,
        endZip: destinationZipcode,
      });
      setMessage("");
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

    const decodedPath = google.maps.geometry.encoding.decodePath(
      routeResult?.routes?.[0].overview_polyline
    );

    let nearestPoint = decodedPath[0];
    let minDistance = google.maps.geometry.spherical.computeDistanceBetween(
      startPoint,
      nearestPoint
    );

    for (const coord of decodedPath) {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        startPoint,
        coord
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = coord;
      }
    }

    const directionsService = new google.maps.DirectionsService();

    const request = {
      origin: startPoint,
      destination: nearestPoint,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        const shortestPath = result?.routes[0].overview_path;

        const directionsDisplay = new window.google.maps.DirectionsRenderer({
          map,
        });
        directionsDisplay.setDirections(result);
      } else {
        console.error("Error fetching directions:", status);
      }
    });
  };

  useEffect(() => {
    findRoute(startZip, endZip);
    setSourceZipCode(sourceZipcode);
  }, [startZip, endZip]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sourceZipcode.length !== 5 || destinationZipcode.length !== 5) {
      setMessage("Please enter valid zip codes.");
      return;
    }

    setStartZip(sourceZipcode);
    setEndZip(destinationZipcode);
    setMessage("");
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
            value={sourceZipcode}
            onChange={(e) => setSourceZipCode(e.target.value)}
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
            value={destinationZipcode}
            onChange={(e) => setDestinationZipcode(e.target.value)}
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
