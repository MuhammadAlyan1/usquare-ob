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
import MapRenderer from "./MapRenderer";

const Maps = () => {
  const [startZip, setStartZip] = useState("51023");
  const [endZip, setEndZip] = useState("51001");
  const [directions, setDirections] = useState(null);
  const auth = getAuth(firebaseApp);
  const userId = auth?.currentUser?.uid;
  const db = getFirestore(firebaseApp);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    const initializeMap = () => {
      const mapElement = document.getElementById("map") as HTMLElement;

      if (!mapElement) {
        console.error("Map element not found");
        return;
      }

      const map = new window.google.maps.Map(mapElement, {
        center: { lat: 0, lng: 0 },
        zoom: 12,
      });

      setMap(map);
    };

    if (document.readyState === "complete") {
      initializeMap();
    } else {
      window.addEventListener("load", initializeMap);
    }

    return () => {
      window.removeEventListener("load", initializeMap);
    };
  }, []);

  return (
    <div className="maps">
      {map && (
        <MapRenderer
          map={map}
          startZip={startZip}
          setStartZip={setStartZip}
          endZip={endZip}
          setEndZip={setEndZip}
        />
      )}
    </div>
  );
};

export default Maps;
