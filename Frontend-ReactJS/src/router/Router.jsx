import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
// Components
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Loader from "../components/Loader/Loader";
// Pages
import Home from '../pages/Home/Home';
import Terms from "../pages/Terms/Terms";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import DeletedAccount from "../pages/DeletedAccount/DeletedAccount";
// Protected pages
import ProtectedUserRoute from "./ProtectedRoute";
import Dashboard from "../pages/Dashboard/Dashboard";
import Addmaterial from "../pages/Addmaterial/Addmaterial";
import Offers from "../pages/Offers/offer";
import Bootcamp from "../pages/Bootcamp/Bootcamp";
import CourseDetails from "../pages/CourseDetails/CourseDetails";
import Work from "../pages/work/Work";

import { getUser } from "../apis/handlers/getUser";

// Pages where the Header (navbar) should NOT be shown
const NO_HEADER_PAGES = ['/login', '/signup', '/deletedAccount'];

const AppLayout = ({ children }) => {
  const location = useLocation();
  const showHeader = !NO_HEADER_PAGES.includes(location.pathname);

  return (
    <>
      {showHeader && <Header />}
      {children}
    </>
  );
};

const Router = () => {
  const loaderDisplay = useSelector((state) => state.loader.display);

  useEffect(() => {
    getUser();
  }, []);

  return (
    <BrowserRouter>
      {loaderDisplay && <Loader />}
      <AppLayout>
        <Routes>
          <Route index element={<Home />} />
          <Route exact path="/" element={<Home />} />
          <Route exact path="terms" element={<Terms />} />
          <Route exact path="login" element={<Login />} />
          <Route exact path="signup" element={<Signup />} />
          <Route exact path="deletedAccount" element={<DeletedAccount />} />
          <Route exact path="add-material" element={<Addmaterial />} />
          <Route exact path="offers" element={<Offers />} />
          <Route path="/bootcamp" element={<Bootcamp />} />
          <Route path="/course" element={<CourseDetails />} />
          <Route path="/Work" element={<Work />} />
          <Route element={<ProtectedUserRoute />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </AppLayout>
      <Footer />
    </BrowserRouter>
  );
};

export default Router;