import React from 'react';
import { HashRouter as Router, Routes, Route } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { StoreProvider } from './contexts/StoreContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Orders } from './pages/Orders';
import { AdminDashboard } from './pages/AdminDashboard';
import { Checkout } from './pages/Checkout';
import { FirebaseSetup } from './components/FirebaseSetup';
import { isFirebaseConfigured } from './firebase';
import { ROUTES } from './constants';

const App: React.FC = () => {
  if (!isFirebaseConfigured) {
    return <FirebaseSetup />;
  }

  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path={ROUTES.HOME} element={<Home />} />
                <Route path={ROUTES.LOGIN} element={<Login />} />
                <Route path={ROUTES.ORDERS} element={<Orders />} />
                <Route path={ROUTES.ADMIN} element={<AdminDashboard />} />
                <Route path={ROUTES.CHECKOUT} element={<Checkout />} />
              </Routes>
            </Layout>
          </Router>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;