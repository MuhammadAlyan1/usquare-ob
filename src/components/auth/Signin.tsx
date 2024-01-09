import React, { useState } from "react";
import { firebaseApp } from "../../firebase";
import { isEmailValid } from "../../utils/isEmailValid";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const auth = getAuth(firebaseApp);
  const navigate = useNavigate();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      setMessage("Please enter email and password.");
      setIsLoading(false);
      return;
    }

    if (!isEmailValid(email)) {
      setMessage("Please enter valid email.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      const { user } = result;

      if (user) {
        setMessage("");
        navigate("/");
      }
    } catch (error: any) {
      console.log("There was an error while signing in: ", error);
      setMessage(error?.code);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin">
      <form className="form" onSubmit={(e) => handleSubmit(e)}>
        <h1 className="form__heading">Signin</h1>
        <div className="form__input-container">
          <label htmlFor="email" className="form__label">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form__input"
          />
        </div>
        <div className="form__input-label-container">
          <label htmlFor="password" className="form__label">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
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
          {isLoading ? "Signing in" : "Sign in"}
        </button>
        {message && <p className="form__feedback">{message}</p>}
      </form>
    </div>
  );
};

export default Signin;
