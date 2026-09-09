import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, ProtectedRoute } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { StoreProvider } from './contexts/StoreContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { SplashScreen } from './components/SplashScreen';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Orders } from './pages/Orders';
import { AdminDashboard } from './pages/AdminDashboard';
import { Checkout } from './pages/Checkout';
import { FirebaseSetup } from './components/FirebaseSetup';
import { isFirebaseConfigured } from './firebase';
import { ROUTES } from './constants';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (!isFirebaseConfigured) {
    return <FirebaseSetup />;
  }

  return (
    <>
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
      <AuthProvider>
        <ThemeProvider>
          <StoreProvider>
            <CartProvider>
              <Router>
                <Layout>
                  <Routes>
                    <Route path={ROUTES.HOME} element={<Home />} />
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route 
                      path={ROUTES.ORDERS} 
                      element={
                        <ProtectedRoute>
                          <Orders />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path={ROUTES.ADMIN} 
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path={ROUTES.CHECKOUT} 
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </Layout>
              </Router>
            </CartProvider>
          </StoreProvider>
        </ThemeProvider>
      </AuthProvider>
    </>
  );
};

export default App;