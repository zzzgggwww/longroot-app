/**
 * 模块说明：前端根组件：根据是否已登录决定渲染登录页还是已登录控制台。
 */
import React, { Suspense, lazy, useState } from 'react';
import { App as AntApp, Spin } from 'antd';
import { API_BASE, TOKEN_KEY, USER_KEY } from './lib/constants';
import { safeParse } from './lib/formatters';

const LoginView = lazy(() => import('./features/auth/LoginView'));
const AuthenticatedApp = lazy(() => import('./features/app/AuthenticatedApp'));

export default function App() {
  const { message } = AntApp.useApp();
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [currentUser, setCurrentUser] = useState(safeParse(localStorage.getItem(USER_KEY)));
  const [loginLoading, setLoginLoading] = useState(false);

  function logout(showMessage = true) {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (showMessage) message.success('已退出登录');
  }

  async function handleLogin(values) {
    setLoginLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '登录失败');
      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      message.success('登录成功');
      return true;
    } catch (error) {
      message.error(error.message);
      return false;
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <Suspense fallback={<div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><Spin size="large" /></div>}>
      {token ? (
        <AuthenticatedApp
          token={token}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onLogout={logout}
        />
      ) : (
        <LoginView onLogin={handleLogin} loading={loginLoading} />
      )}
    </Suspense>
  );
}
