import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome.jsx';
import Catalog from './pages/Catalog.jsx';
import Product from './pages/Product.jsx';
import OrderForm from './pages/OrderForm.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/product/:id" element={<Product />} />
      <Route path="/product/:id/order" element={<OrderForm />} />
      <Route path="/order/:id" element={<OrderConfirmation />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}
