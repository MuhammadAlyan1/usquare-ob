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

  const mapElement = document.getElementById("map") as HTMLElement;

  const map = new window.google.maps.Map(mapElement, {
    center: { lat: 0, lng: 0 },
    zoom: 12,
  });

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
