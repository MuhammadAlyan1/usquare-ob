import axios from "axios";


export const fetchCoordinatesFromZipcode = async (zipcode: string) => {
  try {
    const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`;
    const response = await axios.get(URL);
    const status = response?.data?.status;

    if (status === "ZERO_RESULTS") {
      console.log("The provided zipcode is invalid");
      return null;
    }

    const location = response?.data?.results[0]?.geometry?.location;
    return {
      latitude: location?.lat,
      longitude: location?.lng,
    };

  } catch (error) {
    console.log(
      "There was an error while fetching coordinates from zipcode: ",
      error
    );
    return null;
  }
};
