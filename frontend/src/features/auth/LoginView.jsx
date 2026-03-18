/**
 * 模块说明：登录页面组件：提供用户名密码输入和登录提交界面。
 */
import React, { useState } from 'react';
import { Button, Card, Input, Space, Typography } from 'antd';
import { API_BASE } from '../../lib/constants';
import { BrandMark, UserGlyph } from '../../lib/icons';

const { Title, Text } = Typography;

export default function LoginView({ onLogin, loading }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123456');

  async function submit(event) {
    event.preventDefault();
    await onLogin({ username, password });
  }

  return (
    <div className="login-shell simple-login-shell">
      <Card className="login-card" bordered={false}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div className="login-brand-block">
            <div className="login-brand-row">
              <BrandMark className="brand-icon" />
              <Title level={3} className="login-title" style={{ margin: 0 }}>LongRoot Pro</Title>
            </div>
            <Text className="login-subtitle">Ant Design 响应式控制台</Text>
            <Text className="login-api-text">API {API_BASE}</Text>
          </div>

          <form onSubmit={submit} className="login-form-plain">
            <label className="login-label" htmlFor="login-username">用户名</label>
            <Input
              id="login-username"
              size="large"
              prefix={<UserGlyph />}
              placeholder="请输入用户名"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />

            <label className="login-label" htmlFor="login-password">密码</label>
            <Input.Password
              id="login-password"
              size="large"
              placeholder="请输入密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ marginTop: 20 }}>
              登录控制台
            </Button>
          </form>
        </Space>
      </Card>
    </div>
  );
}
