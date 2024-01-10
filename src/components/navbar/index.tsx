import React, { useEffect } from "react";
import { firebaseApp } from "../../firebase";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Navbar = () => {
  const auth = getAuth(firebaseApp);
  const navigate = useNavigate();
  const isSignedIn = !!auth.currentUser;

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut(auth);
      navigate("/signin");
    } catch (error) {
      console.log("There was in issue while signing out the user: ", error);
    }
  };

  return (
    <nav className="navbar">
      <p className="navbar__organization">
        <Link to="/" className="navbar__link">Usquare Solutions</Link>
      </p>
      <p className="navbar__organization">
        <Link to="/maps" className="navbar__link">Maps</Link>
      </p>

      <div className="navbar__actions">
        {isSignedIn ? (
          <button
            className="navbar__button navbar__button--signout"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        ) : (
          <>
            <button
              className="navbar__button navbar__button--signup"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </button>
            <button
              className="navbar__button navbar__button--signin"
              onClick={() => navigate("/signin")}
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
