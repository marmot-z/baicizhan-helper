import { createHashRouter } from 'react-router-dom';
import Home from './pages/Home.tsx';
import UserInfo from './pages/UserInfo.tsx';
import Login from './pages/Login.tsx';
import Settings from './pages/Settings.tsx';
import Layout from './pages/Layout.tsx';
import RouteGuards from './components/RouteGuards.tsx';

// 使用HashRouter因为Chrome扩展环境下BrowserRouter可能有问题
export const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <RouteGuards><Home /></RouteGuards>,
      },
      {
        path: '/user-info',
        element: <RouteGuards><UserInfo /></RouteGuards>,
      },
      {
        path: '/settings',
        element: <RouteGuards><Settings /></RouteGuards>,
      },
    ],
  },
]);