import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { seedDatabase } from './db/db';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      await seedDatabase();

      const loggedInUser = localStorage.getItem('canalWireUser');
      if (loggedInUser) {
        setUser(JSON.parse(loggedInUser));
      }
      setLoading(false);
    };
    initApp();
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('canalWireUser', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('canalWireUser');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="app-container items-center justify-center">
        <div className="animate-fade">
          <h2 className="text-gradient">Initializing System...</h2>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/*"
          element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
