import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Adminnav from "./components/Adminnav";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
//User
import Home from "./components/Home";
import Rooms from "./screens/Rooms";
import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Bookingscreen from "./screens/Bookingscreen";
import Mybookings from "./screens/Mybookings";
import AboutUs from "./screens/AboutUs";
import ContactUs from "./screens/ContactUs";
import Feedback from "./screens/Feedback";
import Payment from "./screens/Payment";

//Admin
import AdminDashboard from "./components/AdminDashboard";
import AddRooms from "./screens/admin/AddRooms";
import UpdateRoom from "./screens/admin/UpdateRoom";
import AllRooms from "./screens/admin/AllRooms";
import AllUsers from "./screens/admin/AllUsers";
import AllFeedbacks from "./screens/admin/AllFeedbacks";
import AllBookings from "./screens/admin/AllBookings";
import AllCancellations from "./screens/admin/AllCancellations";
import Refunds from "./screens/admin/Refunds";
import AllPayments from "./screens/admin/AllPayments";
import AllInquiries from "./screens/admin/AllInquiries";
import UpdateRefund from "./screens/UpdateRefund";
import AdminProfile from "./components/AdminProfile";

function AppContent() {
  const location = useLocation();
  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/update");

  return (
    <div className="App">
      {isAdminRoute ? <Adminnav /> : <Navbar />}
      <Routes>
        {/* Admin Paths */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/bookings" element={<AllBookings />} />
        <Route path="/admin/rooms" element={<AllRooms />} />
        <Route path="/admin/addroom" element={<AddRooms />} />
        <Route path="/update/:roomid" element={<UpdateRoom />} />
        <Route path="/admin/cancellations" element={<AllCancellations />} />
        <Route path="/admin/refunds" element={<Refunds />} />
        <Route path="/admin/feedback" element={<AllFeedbacks />} />
        <Route path="/admin/inquiries" element={<AllInquiries />} />
        <Route path="/admin/payments" element={<AllPayments />} />
        <Route path="/admin/users" element={<AllUsers />} />
        <Route path="/admin/adminprofile" element={<AdminProfile />} />
        <Route
          path="/admin/updaterefund/:refundid"
          element={<UpdateRefund />}
        />
        {/* User Paths */}
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route
          path="/book/:roomid/:checkindate/:checkoutdate"
          element={<Bookingscreen />}
        />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/bookings" element={<Mybookings />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* Only ONE ToastContainer */}
      <ToastContainer position="top-center" theme="colored" />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
