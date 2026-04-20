import React, { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import GlobalBackground from "./components/GlobalBackground";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext.jsx";

// User Pages
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Seatlayout from "./pages/SeatLayout";
import MyBookings from "./pages/MyBookings";
import Favorite from "./pages/Favorite";

import Theaters from "./pages/Theaters";
import Releases from "./pages/Releases";
import Login from "./pages/Login";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgetPassword.jsx";
import VerifyAccount from "./pages/VerifyAccount.jsx";
import ComingSoonPage from "./pages/ComingSoonPage.jsx";
import PaymentSuccess from "./pages/paymentSuccess.jsx";

// Admin Pages
import Layout from "./pages/admin/Layout";
import DashBoard from "./pages/admin/DashBoard";
import AddShows from "./pages/admin/AddShows";
import ListShows from "./pages/admin/ListShows";
import ListBookings from "./pages/admin/ListBookings";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute.jsx";
import Loading from "./components/Loading.jsx";
import ManageShows from "./pages/admin/ManageShows.jsx";
import EditShow from "./pages/admin/EditShow.jsx";

const App = () => {
  // ✅ Always call hooks at the top
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // ✅ Admin redirect
  useEffect(() => {
    if (!loading && user?.isAdmin && !isAdminRoute) {
      navigate("/admin", { replace: true });
    }
  }, [loading, user, isAdminRoute, navigate]);

  // ✅ Show loading screen until auth is ready
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <GlobalBackground />
      <Toaster />
      <ScrollToTop />
      {!isAdminRoute && <Navbar />}

      <Routes>
        {/* User Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/movies/:id/:date" element={<Seatlayout />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/loading/:nextUrl" element={<Loading />} />
        <Route path="/favorite" element={<Favorite />} />

        <Route path="/theaters" element={<Theaters />} />
        <Route path="/releases" element={<Releases />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/verify" element={<VerifyAccount />} />
        <Route path="/coming-soon/:id" element={<ComingSoonPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />


        {/* Protected Admin Routes */}
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<Layout />}>
            <Route index element={<DashBoard />} />
            <Route path="add-shows" element={<AddShows />} />
            <Route path="list-shows" element={<ListShows />} />
            <Route path="list-bookings" element={<ListBookings />} />
            <Route path="manage-shows" element={<ManageShows />} />
            <Route path="edit-show/:showId" element={<EditShow />} />
          </Route>
        </Route>
      </Routes>

      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;
