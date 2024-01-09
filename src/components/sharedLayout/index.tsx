import { Outlet } from "react-router-dom";
import Navbar from "../navbar/index";

const SharedLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default SharedLayout;
