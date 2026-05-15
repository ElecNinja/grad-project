import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
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
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../pages/Dashboard/Dashboard";
import Addmaterial from "../pages/Addmaterial/Addmaterial";
import Offers from "../pages/Offers/offer";
import Requests from "../pages/Requests/Requests";
import Bootcamp from "../pages/Bootcamp/Bootcamp";
import CourseDetails from "../pages/CourseDetails/CourseDetails";
import Work from "../pages/work/Work";
import Videos from "../pages/Videos/Videos";

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

  // Removed getUser() — user data is saved in Redux after login directly

  return (
    <BrowserRouter>
      {loaderDisplay && <Loader />}
      <AppLayout>
        <Routes>
          {/* Public - anyone can access */}
          <Route index element={<Home />} />
          <Route path="/" element={<Home />} />
          <Route path="terms" element={<Terms />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="deletedAccount" element={<DeletedAccount />} />
          <Route path="/bootcamp" element={<Bootcamp />} />
          <Route path="/course" element={<CourseDetails />} />

          {/* Any logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          {/* Students only */}
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route path="add-material" element={<Addmaterial />} />
            <Route path="requests" element={<Requests />} />
            <Route path="videos" element={<Videos />} />
          </Route>

          {/* Teachers only */}
          <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
            <Route path="offers" element={<Offers />} />
            <Route path="Work" element={<Work />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      <Footer />
    </BrowserRouter>
  );
};

export default Router;