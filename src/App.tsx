import React from "react";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { firebaseApp } from "./firebase";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signin from "./components/auth/Signin";
import Signup from "./components/auth/Signup";
import Home from "./components/home";
import SharedLayout from "./components/sharedLayout";
import Weather from "./components/weather";

function App() {
  const auth = getAuth(firebaseApp);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is signed in: ", user.uid);
    } else {
      console.log("User is signed out");
    }
  });

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SharedLayout />}>
            <Route index element={<Home />} />
            <Route path="signin" element={<Signin />} />
            <Route path="signup" element={<Signup />} />
            <Route path="weather" element={<Weather />} />
          </Route>
          <Route path="*" element={<h1>404</h1>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
