import { useEffect, useState } from "react";
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
import Support from "../pages/Support/Support";
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
import TeacherProfile from "../pages/TeacherProfile/TeacherProfile";
import StudentProfile from "../pages/StudentProfile/StudentProfile";
import TeacherProfileView from "../pages/TeacherProfileView/TeacherProfileView";
import FindExpert from "../pages/FindExpert/FindExpert";
import TeacherCourseUpload from "../pages/TeacherCourseUpload/TeacherCourseUpload";
import { getUser } from "../apis/handlers/getUser";
import { PresenceProvider } from "../context/PresenceContext";
import CoursePlayer from "../pages/Courseplayer/Courseplayer";
import MyList from "../pages/MyList/MyList";

// ─── NEW CHAT IMPORTS ────────────────────────────────────────────────
import ChatFloatingButton from "../components/ChatFloatingButton/ChatFloatingButton";
import ChatPopup from "../components/ChatPopup/ChatPopup";

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
  const user = useSelector((state) => state.user);
  // ─── NEW CHAT STATE ──────────────────────────────────────────────
  const isChatOpen = useSelector((state) => state.chat.isOpen);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        if (user?.loggedIn) {
          return;
        }

        if (typeof window === "undefined") {
          return;
        }

        const token = window.localStorage.getItem("supabase_access_token");
        if (!token) {
          return;
        }

        await getUser();
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [user?.loggedIn]);

  if (!authReady) {
    return <Loader />;
  }

  return (
    <PresenceProvider userId={user?.loggedIn ? user.id : null} role={user?.role}>
      <BrowserRouter>
        {loaderDisplay && <Loader />}
        <AppLayout>
          <Routes>
            {/* Public - anyone can access */}
            <Route index element={<Home />} />
            <Route path="/" element={<Home />} />
            <Route path="terms" element={<Terms />} />
            <Route path="help" element={<Support />} />
            <Route path="support" element={<Support />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="deletedAccount" element={<DeletedAccount />} />
            <Route path="/bootcamp" element={<Bootcamp />} />
            <Route path="/course" element={<CourseDetails />} />
            <Route path="add-material" element={<Addmaterial />} />

            <Route element={<ProtectedRoute />}>
              <Route path="find-expert" element={<FindExpert />} />
            </Route>

            {/* Any logged-in user */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="work" element={<Work />} />
              <Route path="Work" element={<Work />} />
            </Route>

            {/* Students only */}
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              <Route path="requests" element={<Requests />} />
              <Route path="videos" element={<Videos />} />
              <Route path="course-player" element={<CoursePlayer />} />
              <Route path="my-list" element={<MyList />} />
              <Route path="student-profile" element={<StudentProfile />} />
            </Route>

            {/* Teachers only */}
            <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
              <Route path="offers" element={<Offers />} />
              <Route path="teacher-profile" element={<TeacherProfile />} />
              <Route path="course-upload/:bidId" element={<TeacherCourseUpload />} />
            </Route>

            {/* Teacher profile view for logged-in users */}
            <Route element={<ProtectedRoute />}>
              <Route path="teacher-profile/:id" element={<TeacherProfileView />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>

        {/* ─── CHAT FLOATING BUTTON & POPUP ────────────────────────── */}
        {/* Only render if user is logged in (we have a user.id) */}
        {user?.loggedIn && (
          <>
            <ChatFloatingButton />
            {isChatOpen && <ChatPopup />}
          </>
        )}

        <Footer />
      </BrowserRouter>
    </PresenceProvider>
  );
};

export default Router;