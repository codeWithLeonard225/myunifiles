// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthForm from './Component/Auth/AuthForm';
import Registration from './Component/Auth/Registration';
import AdminPage from './Component/Pages/AdminPage';
import DataFormsPage from './Component/Pages/DataFormsPage';
import AdminSignup from './Component/Auth/AdminSignup';
import StudentPage from './Component/Pages/StudentPage';
import AdminPanel from './Component/Pages/AdminPanel';
import ProtectedRoute from './Component/ProtectedRoute';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm setUser={setUser} />} />
        
        
        {/* Protected Routes with specific allowed roles */}

         <Route
          path="/register"
          element={
            <ProtectedRoute user={user} allowedRoles={['Student','CEO']} handleLogout={handleLogout}>
              <Registration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} allowedRoles={['Admin', 'CEO']} handleLogout={handleLogout}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/DataFormsPage"
          element={
            <ProtectedRoute user={user} allowedRoles={['Admin', 'CEO']} handleLogout={handleLogout}>
              <DataFormsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-page"
          element={
            <ProtectedRoute user={user} allowedRoles={['Student','CEO']} handleLogout={handleLogout}>
              <StudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['CEO']} handleLogout={handleLogout}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/AdminSignup"
          element={
            <ProtectedRoute user={user} allowedRoles={['Admin', 'CEO']} handleLogout={handleLogout}>
              <AdminSignup />
            </ProtectedRoute>
          }
        />
       
        <Route path="/*" element={<AuthForm />} />
      </Routes>
    </Router>
  );
}