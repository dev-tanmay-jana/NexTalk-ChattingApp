import React from 'react';
import "./App.css";
import { Toaster } from "react-hot-toast";
import { Route, Routes, Navigate } from 'react-router-dom';
import Login from './Pages/LoginPage.jsx';   // ✅ make sure filename matches
import Home from './Pages/Home.jsx';
import Profile from './Pages/Profile.jsx';
import bgImage from "/bgImage.svg";  // ✅ cleaner import path
import { AuthContext } from '../src/Context/AuthContext.jsx';
import { useContext } from 'react';

const App = () => {
    const {authUser} = useContext(AuthContext);
  return (
    <>
      <div
        style={{ backgroundImage: `url(${bgImage})` }}
        className="bg-no-repeat bg-cover h-screen w-screen flex justify-center items-center px-4 sm:px-6 md:px-8"
      >
        <Toaster reverseOrder={false} />
        <Routes>
            <Route path="/" element={authUser ? <Home /> : <Navigate to="/login" />} />
            <Route path="/login" element={!authUser ? <Login /> : <Navigate to="/" />} />
            <Route path="/profile" element={authUser ? <Profile /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </>
  );
};

export default App;