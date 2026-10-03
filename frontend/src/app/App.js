import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import AppRoutes from './routes';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
