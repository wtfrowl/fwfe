import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { routes } from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { setupAxiosInterceptors } from './utils/axiosInterceptors.ts';

setupAxiosInterceptors(); // 🔑 Setup before rendering app

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
