/**
 * 模块说明：用户管理组件：提供管理员查看用户、创建用户、改角色状态、改密码。
 */
import React, { useMemo, useState } from 'react';
import { Button, Card, Empty, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';

const { Text } = Typography;

const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' }
];

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 }
];

function statusTag(status) {
  return Number(status) === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">停用</Tag>;
}

export default function UserManagement({ currentUser, users, loading, onRefresh, onCreate, onUpdate, onChangePassword }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const isAdmin = currentUser?.role === 'admin';

  const columns = useMemo(() => [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', width: 160 },
    {
      title: '角色', dataIndex: 'role', width: 120,
      render: (value) => value === 'admin' ? <Tag color="processing">管理员</Tag> : <Tag>普通用户</Tag>
    },
    { title: '状态', dataIndex: 'status', width: 100, render: (value) => statusTag(value) },
    { title: '创建时间', dataIndex: 'created_at', width: 180 },
    {
      title: '操作', key: 'actions', width: 260,
      render: (_, row) => (
        <Space wrap size={4}>
          <Button size="small" onClick={() => {
            editForm.setFieldsValue({ role: row.role, status: Number(row.status) });
            setEditingUser(row);
          }}>角色/状态</Button>
          <Button size="small" onClick={() => {
            passwordForm.resetFields();
            setPasswordUser(row);
          }}>改密码</Button>
        </Space>
      )
    }
  ], [editForm, passwordForm]);

  async function submitCreate() {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      const ok = await onCreate(values);
      if (ok) {
        createForm.resetFields();
        setCreateOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function submitEdit() {
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      const ok = await onUpdate(editingUser, values);
      if (ok) setEditingUser(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPassword() {
    try {
      const values = await passwordForm.validateFields();
      setSubmitting(true);
      const ok = await onChangePassword(passwordUser, values);
      if (ok) {
        passwordForm.resetFields();
        setPasswordUser(null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Card
        title="用户管理"
        extra={isAdmin ? (
          <Space>
            <Button onClick={onRefresh}>刷新</Button>
            <Button type="primary" onClick={() => setCreateOpen(true)}>新建用户</Button>
          </Space>
        ) : null}
        className="panel-card"
      >
        {!isAdmin ? (
          <Empty description="当前账号不是管理员，无法管理用户" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            <div className="user-mgmt-summary">
              <div>
                <div className="detail-section-title">管理范围</div>
                <Text type="secondary">当前支持：用户列表、创建用户、调整角色/状态、管理员重置密码。</Text>
              </div>
              <div>
                <div className="detail-section-title">安全提示</div>
                <Text type="secondary">系统会阻止你停用自己或把自己降成非管理员，避免误锁死后台。</Text>
              </div>
            </div>
            <Table
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={users}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              locale={{ emptyText: '暂无用户' }}
              scroll={{ x: 920 }}
            />
          </>
        )}
      </Card>

      <Modal title="新建用户" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={submitCreate} confirmLoading={submitting} destroyOnClose>
        <Form form={createForm} layout="vertical" initialValues={{ role: 'user', status: 1 }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '至少 3 位' }]}>
            <Input placeholder="例如 operator" />
          </Form.Item>
          <Form.Item name="password" label="初始密码" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '至少 6 位' }]}>
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={editingUser ? `调整用户：${editingUser.username}` : '调整用户'} open={!!editingUser} onCancel={() => setEditingUser(null)} onOk={submitEdit} confirmLoading={submitting} destroyOnClose>
        <Form form={editForm} layout="vertical">
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={passwordUser ? `修改密码：${passwordUser.username}` : '修改密码'} open={!!passwordUser} onCancel={() => setPasswordUser(null)} onOk={submitPassword} confirmLoading={submitting} destroyOnClose>
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="password" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少 6 位' }]}>
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
