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

const Maps = () => {
  const [startZip, setStartZip] = useState("51023");
  const [endZip, setEndZip] = useState("51001");
  const [directions, setDirections] = useState(null);
  const [wayPoint, setWayPoint] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const auth = getAuth(firebaseApp);
  const userId = auth?.currentUser?.uid;
  const db = getFirestore(firebaseApp);

  const findRoute = async (startZip: string, endZip: string) => {
    const startLocation = await fetchCoordinatesFromZipcode(startZip);
    const endLocation = await fetchCoordinatesFromZipcode(endZip);

    // @ts-ignore
    const map = new window.google.maps.Map(document.getElementById("map"), {
      center: {
        lat: startLocation?.latitude,
        lng: startLocation?.longitude,
      },
      zoom: 8,
    });

    // @ts-ignore
    const directionsService = new window.google.maps.DirectionsService();
    // @ts-ignore
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map,
    });

    // @ts-ignore
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
        waypoints: wayPoint ? [{ location: wayPoint }] : undefined,
        // @ts-ignore
        travelMode: "DRIVING",
      },
      (result: any, status: string) => {
        if (status === "OK") {
          setDirections(result);
          directionsRenderer.setDirections(result);
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
      <div id="map" style={{ height: "600px" }}></div>
    </div>
  );
};

export default Maps;
