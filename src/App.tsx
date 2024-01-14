import { useState, useEffect, useReducer, createContext } from 'react';

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from './firebase';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signin from './components/auth/Signin';
import Signup from './components/auth/Signup';
import Home from './components/home';
import SharedLayout from './components/sharedLayout';
import Maps from './components/maps';
import reducer from './reducer';

export const authContext = createContext<any>(null);

function App() {
  const auth = getAuth(firebaseApp);
  const defaultValue = {
    userId: null
  };

  const [state, dispatch] = useReducer(reducer, defaultValue);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is signed in: ', user.uid);
        dispatch({
          type: 'SIGN_IN',
          payload: user.uid
        });
      } else {
        console.log('User is signed out');
        dispatch({
          type: 'SIGN_OUT'
        });
      }
    });

    return () => {
      // Unsubscribe when the component unmounts
      unsubscribe();
    };
  }, [auth]); // Make sure to include auth as a dependency

  return (
    // @ts-ignore
    <authContext.Provider value={{ state, dispatch }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SharedLayout />}>
            <Route index element={<Home />} />
            <Route path="signin" element={<Signin />} />
            <Route path="signup" element={<Signup />} />
            <Route path="maps" element={<Maps />} />
          </Route>
          <Route path="*" element={<h1>404</h1>} />
        </Routes>
      </BrowserRouter>
    </authContext.Provider>
  );
}

export default App;
