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
          map.addListener("click", (e: any) => {
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

  // TODO: FIX THE ABILITY TO CALCULATE SHORTEST PATH BETWEEN ROUTE AND USER.
  const handleMapClick = (clickedPoint: any, routeResult: any) => {
    // const isOnRoute = isPointOnRoute(clickedPoint, routeResult);
    console.log("CLICKED POINT: ", clickedPoint);
    const clickedCoordinates = {
      lat: clickedPoint.lat(),
      lng: clickedPoint.lng(),
    };

    const sourceCoordinates = {
      lat: 42.92414668688901,
      lng: -96.45792481445315,
    };

    // ====================
    const startPoint = sourceCoordinates;

    // Assuming you have the encoded polyline

    // Decode the polyline
    const decodedPath =
      google.maps.geometry.encoding.decodePath(overview_polygon);

    // Find the nearest point on the polyline to the starting point
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

    console.log("NEAREST POINT: ", nearestPoint);
    // Create a DirectionsService
    const directionsService = new google.maps.DirectionsService();

    // Set up the DirectionsRequest to go from the starting point to the nearest point on the polyline
    const request = {
      origin: startPoint,
      destination: nearestPoint,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    // Call the DirectionsService route method
    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        // The result object contains information about the shortest path
        // @ts-ignore
        const shortestPath = result.routes[0].overview_path;
        // You can use the shortest path to display or calculate further information
        console.log("Shortest path:", shortestPath);
      } else {
        console.error("Error fetching directions:", status);
      }
    });
  };

  if (directions) {
    console.log(
      "OVERVIEW_PATHS : ",
      // @ts-ignore
      directions?.routes?.[0].overview_path?.map((path) => ({
        lat: path.lat(),
        lng: path.lng(),
      }))
    );

    // @ts-ignore
    const routeCoordinates = directions?.routes?.[0].overview_path?.map(
      (path: any) => ({
        lat: path.lat(),
        lng: path.lng(),
      })
    );

    console.log(directions);
  }

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

const overview_polygon =
  "osoeGzbykQElu@?tQ?rT@`FxC?dI?zF?tS@dK@bIAhCBjCLdCD`XDzBRxFl@jCVzCXzBFtE@jA@bWTliAdA~XXzDH|E\fFv@lB`@vGjBhLlDnKbD|J|CpCz@jEbBlAh@|BjAbExBnDpBlCtBpBxBbDdEbEjFfGzH|AfB|DbE~SlSbC|BbBrA~@n@rCtAx@XzAd@`BZvB`@pEv@hF~@hCx@bAb@n@ZfBdAhAx@pD`DfIhHbHrF~CbCvCtBpAn@fBl@`F|@jMvBvG`AzE^rV\tNXhIJdJH|JBzPJx}A`Bb]^jJ`@hAJzCj@vBr@bCfA|EzC|A`AzJfGdQzK`EhC|CjBdAd@`AXdBZlBJ~B@rHF`CNnCZ~FdApDv@hBh@nAf@pAn@bAl@|@l@fCtBxD~ChZpWpBhBjAlApAvAbBrBtBvCtEnHnAbB^b@tAnA|@r@x@f@hCtAzEzBpHlDdEpBz@`@AqC?sCCeHGcEu]Cap@Cmb@";

const destinationsCoordinates = [
  {
    lat: 43.011280000000006,
    lng: -96.47166000000001,
  },
  {
    lat: 43.01131,
    lng: -96.48037000000001,
  },
  {
    lat: 43.01131,
    lng: -96.48336,
  },
  {
    lat: 43.01131,
    lng: -96.48682000000001,
  },
  {
    lat: 43.011300000000006,
    lng: -96.48795000000001,
  },
  {
    lat: 43.01053,
    lng: -96.48795000000001,
  },
  {
    lat: 43.008900000000004,
    lng: -96.48795000000001,
  },
  {
    lat: 43.00764,
    lng: -96.48795000000001,
  },
  {
    lat: 43.00433,
    lng: -96.48796,
  },
  {
    lat: 43.00238,
    lng: -96.48797,
  },
  {
    lat: 43.00076000000001,
    lng: -96.48796,
  },
  {
    lat: 43.00007,
    lng: -96.48798000000001,
  },
  {
    lat: 42.999370000000006,
    lng: -96.48805,
  },
  {
    lat: 42.99870000000001,
    lng: -96.48808000000001,
  },
  {
    lat: 42.994690000000006,
    lng: -96.48811,
  },
  {
    lat: 42.99407,
    lng: -96.48821000000001,
  },
  {
    lat: 42.99282,
    lng: -96.48844000000001,
  },
  {
    lat: 42.99212000000001,
    lng: -96.48856,
  },
  {
    lat: 42.99134,
    lng: -96.48869,
  },
  {
    lat: 42.99072,
    lng: -96.48873,
  },
  {
    lat: 42.989650000000005,
    lng: -96.48874,
  },
  {
    lat: 42.989270000000005,
    lng: -96.48875000000001,
  },
  {
    lat: 42.98541,
    lng: -96.48886,
  },
  {
    lat: 42.9735,
    lng: -96.48921000000001,
  },
  {
    lat: 42.96934,
    lng: -96.48934000000001,
  },
  {
    lat: 42.9684,
    lng: -96.48939000000001,
  },
  {
    lat: 42.967290000000006,
    lng: -96.48954,
  },
  {
    lat: 42.96613000000001,
    lng: -96.48982000000001,
  },
  {
    lat: 42.96558,
    lng: -96.48999,
  },
  {
    lat: 42.964180000000006,
    lng: -96.49053,
  },
  {
    lat: 42.962050000000005,
    lng: -96.49140000000001,
  },
  {
    lat: 42.96005,
    lng: -96.49222,
  },
  {
    lat: 42.95814,
    lng: -96.49301000000001,
  },
  {
    lat: 42.95741,
    lng: -96.49331000000001,
  },
  {
    lat: 42.956390000000006,
    lng: -96.49381000000001,
  },
  {
    lat: 42.956,
    lng: -96.49402,
  },
  {
    lat: 42.95537,
    lng: -96.49440000000001,
  },
  {
    lat: 42.954390000000004,
    lng: -96.49501000000001,
  },
  {
    lat: 42.95351,
    lng: -96.49558,
  },
  {
    lat: 42.9528,
    lng: -96.49617,
  },
  {
    lat: 42.95223,
    lng: -96.49678,
  },
  {
    lat: 42.95141,
    lng: -96.49777,
  },
  {
    lat: 42.950430000000004,
    lng: -96.49895000000001,
  },
  {
    lat: 42.949110000000005,
    lng: -96.50053000000001,
  },
  {
    lat: 42.948640000000005,
    lng: -96.50105,
  },
  {
    lat: 42.94769,
    lng: -96.50203,
  },
  {
    lat: 42.94433,
    lng: -96.5053,
  },
  {
    lat: 42.943670000000004,
    lng: -96.50593,
  },
  {
    lat: 42.94317,
    lng: -96.50635000000001,
  },
  {
    lat: 42.94285,
    lng: -96.50659,
  },
  {
    lat: 42.94211000000001,
    lng: -96.50702000000001,
  },
  {
    lat: 42.94182000000001,
    lng: -96.50715000000001,
  },
  {
    lat: 42.94136,
    lng: -96.50734000000001,
  },
  {
    lat: 42.940870000000004,
    lng: -96.50748,
  },
  {
    lat: 42.940270000000005,
    lng: -96.50765000000001,
  },
  {
    lat: 42.939220000000006,
    lng: -96.50793,
  },
  {
    lat: 42.938050000000004,
    lng: -96.50825,
  },
  {
    lat: 42.937360000000005,
    lng: -96.50854000000001,
  },
  {
    lat: 42.937020000000004,
    lng: -96.50872000000001,
  },
  {
    lat: 42.936780000000006,
    lng: -96.50886000000001,
  },
  {
    lat: 42.936260000000004,
    lng: -96.50921000000001,
  },
  {
    lat: 42.93589,
    lng: -96.5095,
  },
  {
    lat: 42.935,
    lng: -96.51031,
  },
  {
    lat: 42.93336,
    lng: -96.51180000000001,
  },
  {
    lat: 42.931900000000006,
    lng: -96.51302000000001,
  },
  {
    lat: 42.9311,
    lng: -96.51368000000001,
  },
  {
    lat: 42.93034,
    lng: -96.51427000000001,
  },
  {
    lat: 42.929930000000006,
    lng: -96.51451,
  },
  {
    lat: 42.929410000000004,
    lng: -96.51474,
  },
  {
    lat: 42.92828,
    lng: -96.51505,
  },
  {
    lat: 42.92598,
    lng: -96.51565000000001,
  },
  {
    lat: 42.924580000000006,
    lng: -96.51598000000001,
  },
  {
    lat: 42.923480000000005,
    lng: -96.51614000000001,
  },
  {
    lat: 42.919700000000006,
    lng: -96.51629000000001,
  },
  {
    lat: 42.917190000000005,
    lng: -96.51642000000001,
  },
  {
    lat: 42.91554,
    lng: -96.51648,
  },
  {
    lat: 42.91375,
    lng: -96.51653,
  },
  {
    lat: 42.911840000000005,
    lng: -96.51655000000001,
  },
  {
    lat: 42.90898000000001,
    lng: -96.51661000000001,
  },
  {
    lat: 42.89381,
    lng: -96.51710000000001,
  },
  {
    lat: 42.88899000000001,
    lng: -96.51726000000001,
  },
  {
    lat: 42.887170000000005,
    lng: -96.51743,
  },
  {
    lat: 42.8868,
    lng: -96.51749000000001,
  },
  {
    lat: 42.88602,
    lng: -96.51771000000001,
  },
  {
    lat: 42.88542,
    lng: -96.51797,
  },
  {
    lat: 42.88476,
    lng: -96.51833,
  },
  {
    lat: 42.88365,
    lng: -96.51911000000001,
  },
  {
    lat: 42.88318,
    lng: -96.51944,
  },
  {
    lat: 42.881280000000004,
    lng: -96.52076000000001,
  },
  {
    lat: 42.878370000000004,
    lng: -96.52282000000001,
  },
  {
    lat: 42.8774,
    lng: -96.52351,
  },
  {
    lat: 42.87661000000001,
    lng: -96.52405,
  },
  {
    lat: 42.87626,
    lng: -96.52424,
  },
  {
    lat: 42.875930000000004,
    lng: -96.52437,
  },
  {
    lat: 42.875420000000005,
    lng: -96.52451,
  },
  {
    lat: 42.87487,
    lng: -96.52457000000001,
  },
  {
    lat: 42.874230000000004,
    lng: -96.52458000000001,
  },
  {
    lat: 42.872690000000006,
    lng: -96.52462000000001,
  },
  {
    lat: 42.872040000000005,
    lng: -96.52470000000001,
  },
  {
    lat: 42.871320000000004,
    lng: -96.52484000000001,
  },
  {
    lat: 42.87004,
    lng: -96.52519000000001,
  },
  {
    lat: 42.869150000000005,
    lng: -96.52547000000001,
  },
  {
    lat: 42.86862000000001,
    lng: -96.52568000000001,
  },
  {
    lat: 42.86822,
    lng: -96.52588,
  },
  {
    lat: 42.867810000000006,
    lng: -96.52612,
  },
  {
    lat: 42.867470000000004,
    lng: -96.52635000000001,
  },
  {
    lat: 42.867160000000005,
    lng: -96.52658000000001,
  },
  {
    lat: 42.86648,
    lng: -96.52717000000001,
  },
  {
    lat: 42.865550000000006,
    lng: -96.52797000000001,
  },
  {
    lat: 42.861180000000004,
    lng: -96.53190000000001,
  },
  {
    lat: 42.86061,
    lng: -96.53243,
  },
  {
    lat: 42.86023,
    lng: -96.53282,
  },
  {
    lat: 42.859820000000006,
    lng: -96.53326000000001,
  },
  {
    lat: 42.859320000000004,
    lng: -96.53384000000001,
  },
  {
    lat: 42.85873,
    lng: -96.53460000000001,
  },
  {
    lat: 42.85766,
    lng: -96.53612000000001,
  },
  {
    lat: 42.857260000000004,
    lng: -96.53662000000001,
  },
  {
    lat: 42.8571,
    lng: -96.53680000000001,
  },
  {
    lat: 42.85667,
    lng: -96.53720000000001,
  },
  {
    lat: 42.85636,
    lng: -96.53746000000001,
  },
  {
    lat: 42.85607,
    lng: -96.53766,
  },
  {
    lat: 42.855380000000004,
    lng: -96.53809000000001,
  },
  {
    lat: 42.85428,
    lng: -96.53871000000001,
  },
  {
    lat: 42.85275,
    lng: -96.53958,
  },
  {
    lat: 42.851760000000006,
    lng: -96.54015000000001,
  },
  {
    lat: 42.85146,
    lng: -96.54032000000001,
  },
  {
    lat: 42.851470000000006,
    lng: -96.53959,
  },
  {
    lat: 42.851470000000006,
    lng: -96.53885000000001,
  },
  {
    lat: 42.851490000000005,
    lng: -96.53738000000001,
  },
  {
    lat: 42.851530000000004,
    lng: -96.53272000000001,
  },
  {
    lat: 42.851560000000006,
    lng: -96.52781,
  },
  {
    lat: 42.851580000000006,
    lng: -96.51996000000001,
  },
  {
    lat: 42.851600000000005,
    lng: -96.51429,
  },
];
