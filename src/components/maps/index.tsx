import React, { useEffect, useState } from "react";
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

const map = new window.google.maps.Map(
  document.getElementById("map") as HTMLElement,
  {
    center: {
      lat: 42.851560000000006,
      lng: -96.52781,
    },
  }
);

const Maps = () => {
  const [startZip, setStartZip] = useState("51023");
  const [endZip, setEndZip] = useState("51001");
  const [directions, setDirections] = useState(null);
  const auth = getAuth(firebaseApp);
  const userId = auth?.currentUser?.uid;
  const db = getFirestore(firebaseApp);

  const findRoute = async (sourceZip: string, destinationZip: string) => {
    const startLocation = await fetchCoordinatesFromZipcode(sourceZip);
    const endLocation = await fetchCoordinatesFromZipcode(destinationZip);
    console.log("FIND ROUTE GOT INVOKED");

    const directionsService = new window.google.maps.DirectionsService();

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
          const directionsDisplay = new window.google.maps.DirectionsRenderer({
            map,
          });
          directionsDisplay.setDirections(result);
          map?.addListener("click", (e: any) => {
            handleMapClick(e.latLng, result);
          });
        } else {
          console.error(`Directions request failed due to ${status}`);
        }
      }
    );
  };

  const saveZipCodesInDb = async () => {
    if (!userId) {
      console.log("Please log in to save zip codes");
      return;
    }

    if (!startZip || !endZip) {
      console.log("Please enter both zip codes");
      return;
    }

    const mapsCollection = collection(db, "maps");
    try {
      await setDoc(doc(mapsCollection, userId), {
        userId,
        startZip,
        endZip,
      });
    } catch (error) {
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
    const fetchSavedZipCodes = async () => {
      if (!userId) {
        console.log("Please log retrive saved zip codes");
        findRoute(startZip, endZip);
        return;
      }

      try {
        const userZipcodeRef = doc(db, "maps", userId);
        const zipCodeSnapshot = await getDoc(userZipcodeRef);

        if (zipCodeSnapshot.exists()) {
          const zipCodesData = zipCodeSnapshot.data();
          setStartZip(zipCodesData.startZip);
          setEndZip(zipCodesData.endZip);

          findRoute(zipCodesData.startZip, zipCodesData.endZip);
          return;
        }
        findRoute(startZip, endZip);
      } catch (error) {
        console.log("There was an error while trying to save zipcodes", error);
      }
    };
    fetchSavedZipCodes();
  }, [userId]);

  return (
    <div className="maps">
      <form className="maps__form form">
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
        <button
          type="button"
          className="form__submit-button"
          onClick={() => findRoute(startZip, endZip)}
        >
          Find Route
        </button>
        <button
          type="button"
          className="form__submit-button"
          onClick={saveZipCodesInDb}
        >
          Save Zip codes
        </button>
      </form>
      <div id="map" style={{ height: "0px" }}></div>
    </div>
  );
};

export default Maps;
