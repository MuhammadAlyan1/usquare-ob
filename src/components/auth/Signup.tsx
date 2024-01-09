import React, { useState } from "react";
import { firebaseApp } from "../../firebase";
import { isEmailValid } from "../../utils/isEmailValid";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getFirestore,
  setDoc,
  doc,
  addDoc,
} from "firebase/firestore";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const db = getFirestore(firebaseApp);

  const auth = getAuth(firebaseApp);
  const navigate = useNavigate();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password || !confirmPassword || !fullName) {
      setMessage("Please enter all fields.");
      setIsLoading(false);
      return;
    }

    if (!isEmailValid(email)) {
      setMessage("Please enter valid email.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Password and confirm password do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const { user } = response;
      const userId = user.uid;

      const usersCollection = collection(db, "users");

      await setDoc(doc(usersCollection, userId), {
        fullName,
        userId,
        email,
      });

      setMessage("");
      navigate("/signin");
    } catch (error: any) {
      console.log("There was an error while trying to sign up: ", error);
      setMessage(error?.code);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup">
      <form className="form" onSubmit={(e) => handleSubmit(e)}>
        <h1 className="form__heading">Signup</h1>
        <div className="form__input-label-container">
          <label htmlFor="signup_fullName" className="form__label">
            Full Name
          </label>
          <input
            type="text"
            id="signup_fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="form__input"
          />
        </div>
        <div className="form__input-label-container">
          <label htmlFor="signup_email" className="form__label">
            Email
          </label>
          <input
            type="email"
            id="signup_email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form__input"
          />
        </div>
        <div className="form__input-label-container">
          <label htmlFor="signup_password" className="form__label">
            Password
          </label>
          <input
            type="password"
            id="signup_password"
            name="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="form__input"
          />
        </div>
        <div className="form__input-label-container">
          <label htmlFor="signup_confirm_password" className="form__label">
            Confirm Password
          </label>
          <input
            type="password"
            id="signup_confirm_password"
            name="confirm_password"
            value={confirmPassword}
            autoComplete="current-password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form__input"
          />
        </div>
        <button
          className={`form__submit-button ${
            isLoading ? "form__submit-button--disabled" : ""
          }`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Signing up" : "Sign up"}
        </button>
        {message && <p className="form__feedback">{message}</p>}
      </form>
    </div>
  );
};

export default Signup;
