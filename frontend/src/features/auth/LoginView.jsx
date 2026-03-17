import React, { useState } from 'react';
import { BarChartOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Input, Space, Typography } from 'antd';
import { API_BASE } from '../../lib/constants';

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
          <div>
            <Space align="center">
              <BarChartOutlined className="brand-icon" />
              <Title level={3} style={{ margin: 0 }}>LongRoot Pro</Title>
            </Space>
            <Text type="secondary">Ant Design 响应式控制台 · API {API_BASE}</Text>
          </div>

          <form onSubmit={submit} className="login-form-plain">
            <label className="login-label" htmlFor="login-username">用户名</label>
            <Input
              id="login-username"
              size="large"
              prefix={<UserOutlined />}
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
