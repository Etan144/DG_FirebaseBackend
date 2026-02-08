import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reviews from "./pages/Reviews";
import Download from "./pages/Download";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/download" element={<Download />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}