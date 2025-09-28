import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';

interface RouteGuardsProps {
  children: React.ReactNode;
}

const RouteGuards: React.FC<RouteGuardsProps> = ({ children }) => {
  const { isLogin } = useAuthStore();

  // 如果用户未登录，则重定向到登录页面
  if (!isLogin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RouteGuards;