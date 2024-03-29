import React, { useEffect, useState, useContext } from "react";
import { firebaseApp } from "../../firebase";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getFirestore, getDoc, collection, doc } from "firebase/firestore";
import { authContext } from "../../App";

type UserType = {
  fullName: string;
  email: string;
  userId: string;
};

const Home = () => {
  const auth = getAuth(firebaseApp);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserType | null>();
  const [isLoading, setIsLoading] = useState(false);
  // const userId = auth?.currentUser?.uid;
  const { state } = useContext(authContext);
  const { userId } = state;

  useEffect(() => {
    if (!userId) {
      navigate("/signin");
      return;
    }

    const fetchUser = async (userId: string) => {
      try {
        setIsLoading(true);
        const db = getFirestore();
        const userRef = doc(db, "users", userId);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          setUserInfo(userSnapshot.data() as UserType);
        }
      } catch (error) {
        console.log("There was an error while fetching user: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser(userId);
  }, [userId]);

  return (
    <div className="home">
      <h1 className="home__heading">Usquare Solutions</h1>
      {userInfo && (
        <p className="home__greeting">Welcome back {userInfo?.fullName}</p>
      )}
      {isLoading && <p className="home__loading">Loading..</p>}
    </div>
  );
};

export default Home;
