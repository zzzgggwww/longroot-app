import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChartOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined,
  UserOutlined
} from '@ant-design/icons';
import { BetaSchemaForm } from '@ant-design/pro-components';
import {
  App as AntApp,
  Button,
  Card,
  Col,
  Descriptions,
  Grid,
  Input,
  Layout,
  List,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography
} from 'antd';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const defaultApiBase = `${window.location.protocol}//${window.location.hostname}:3000/api`;
const API_BASE = import.meta.env.VITE_API_BASE || defaultApiBase;
const TOKEN_KEY = 'longroot_token';
const USER_KEY = 'longroot_user';

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function defaultProjectForm() {
  return {
    symbol: 'BTCUSDT',
    period: 'H',
    buyAmountPerOrder: 100,
    takeProfitMultiple: 2,
    sellDivisor: 4,
    status: 1
  };
}

function money(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

function signalTag(action) {
  if (action === 'BUY') return <Tag color="success">BUY</Tag>;
  if (action === 'SELL') return <Tag color="error">SELL</Tag>;
  if (action === 'HOLD') return <Tag color="processing">HOLD</Tag>;
  return <Tag>-</Tag>;
}

function statusTag(value) {
  return Number(value) === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>;
}

function projectFormColumns() {
  return [
    {
      title: '交易对',
      dataIndex: 'symbol',
      valueType: 'text',
      formItemProps: { rules: [{ required: true, message: '请输入交易对' }] },
      fieldProps: { placeholder: 'BTCUSDT' }
    },
    {
      title: '周期',
      dataIndex: 'period',
      valueType: 'select',
      valueEnum: {
        H: { text: 'H' },
        D: { text: 'D' },
        W: { text: 'W' }
      },
      formItemProps: { rules: [{ required: true, message: '请选择周期' }] }
    },
    {
      title: '每次买入金额',
      dataIndex: 'buyAmountPerOrder',
      valueType: 'digit',
      fieldProps: { min: 0, precision: 2 }
    },
    {
      title: '限红倍数',
      dataIndex: 'takeProfitMultiple',
      valueType: 'digit',
      fieldProps: { min: 0, precision: 2 }
    },
    {
      title: '卖出除数',
      dataIndex: 'sellDivisor',
      valueType: 'digit',
      fieldProps: { min: 1, precision: 2 }
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'radio',
      valueEnum: {
        1: { text: '启用' },
        0: { text: '停用' }
      }
    }
  ];
}

function LoginView({ onLogin, loading }) {
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

function MetricGrid({ metrics }) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} xl={6}>
        <Card><Statistic title="项目总数" value={metrics.total} /></Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card><Statistic title="启用项目" value={metrics.enabled} /></Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card><Statistic title="累计投入" value={Number(money(metrics.invested))} precision={2} /></Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card><Statistic title="当前持仓市值" value={Number(money(metrics.value))} precision={2} /></Card>
      </Col>
    </Row>
  );
}

function ProjectCards({ projects, selectedProjectId, onSelect, onEdit, onSync, onDelete }) {
  return (
    <List
      dataSource={projects}
      locale={{ emptyText: '暂无项目' }}
      renderItem={(item) => (
        <List.Item style={{ padding: 0, border: 'none', marginBottom: 12 }}>
          <Card
            className={`project-mobile-card ${item.id === selectedProjectId ? 'project-mobile-card-active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <div className="row-split">
                <div>
                  <div className="project-code">{item.project_code}</div>
                  <Text type="secondary">{item.symbol} · {item.period}</Text>
                </div>
                {statusTag(item.status)}
              </div>
              <div className="row-split">
                <Text>最新信号</Text>
                {signalTag(item.latest_signal_action)}
              </div>
              <div className="row-split">
                <Text>当前市值</Text>
                <Text strong>{money(item.position_value)}</Text>
              </div>
              <Space wrap>
                <Button size="small" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>编辑</Button>
                <Button size="small" onClick={(e) => { e.stopPropagation(); onSync(item.id); }}>同步</Button>
                <Button size="small" danger onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>删除</Button>
              </Space>
            </Space>
          </Card>
        </List.Item>
      )}
    />
  );
}

function SignalList({ data }) {
  return (
    <List
      dataSource={data}
      locale={{ emptyText: '暂无信号' }}
      renderItem={(item) => (
        <List.Item>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div className="row-split">
              {signalTag(item.action)}
              <Text type="secondary">{formatTime(item.signal_time)}</Text>
            </div>
            <Text>{item.reason || '-'}</Text>
            <div className="row-split wrap-on-mobile">
              <Text>金额/数量：{item.amount}</Text>
              <Text>价格：{money(item.price, 4)}</Text>
            </div>
          </Space>
        </List.Item>
      )}
    />
  );
}

function IndicatorList({ data }) {
  return (
    <List
      dataSource={data}
      locale={{ emptyText: '暂无指标' }}
      renderItem={(item) => (
        <List.Item>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">{formatTime(item.candle_time)}</Text>
            <div className="row-split"><Text>价格</Text><Text strong>{item.price}</Text></div>
            <div className="row-split"><Text>DIF</Text><Text strong>{item.dif}</Text></div>
            <div className="row-split"><Text>DEA</Text><Text strong>{item.dea}</Text></div>
          </Space>
        </List.Item>
      )}
    />
  );
}

export default function App() {
  const { message, modal } = AntApp.useApp();
  const screens = useBreakpoint();
  const mobile = !screens.lg;

  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [currentUser, setCurrentUser] = useState(safeParse(localStorage.getItem(USER_KEY)));
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [projectSignals, setProjectSignals] = useState([]);
  const [projectIndicators, setProjectIndicators] = useState([]);
  const [loginLoading, setLoginLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) logout(false);
      throw new Error(data.message || `请求失败: ${response.status}`);
    }
    return data;
  }

  function logout(showMessage = true) {
    setToken('');
    setCurrentUser(null);
    setProjects([]);
    setSelectedProjectId(null);
    setProjectDetail(null);
    setProjectSignals([]);
    setProjectIndicators([]);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (showMessage) message.success('已退出登录');
  }

  async function loadProjectDetail(id) {
    if (!id) return;
    setDetailLoading(true);
    try {
      setSelectedProjectId(id);
      const [detail, signals, indicators] = await Promise.all([
        request(`/projects/${id}`),
        request(`/projects/${id}/signals?limit=20`),
        request(`/projects/${id}/indicators?limit=20`)
      ]);
      setProjectDetail(detail);
      setProjectSignals(signals);
      setProjectIndicators(indicators);
    } catch (error) {
      message.error(error.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadProjects(selectFirst = true) {
    if (!token) return;
    setProjectLoading(true);
    try {
      const data = await request('/projects');
      setProjects(data);
      const targetId = selectedProjectId && data.some((item) => item.id === selectedProjectId)
        ? selectedProjectId
        : (selectFirst ? data[0]?.id : null);
      if (targetId) {
        await loadProjectDetail(targetId);
      } else {
        setSelectedProjectId(null);
        setProjectDetail(null);
        setProjectSignals([]);
        setProjectIndicators([]);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setProjectLoading(false);
    }
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

  async function syncAll() {
    setSyncLoading(true);
    try {
      const data = await request('/market/sync', { method: 'POST' });
      const okCount = (data.results || []).filter((item) => item.ok).length;
      message.success(`同步完成，成功 ${okCount} 个项目`);
      await loadProjects(false);
      if (selectedProjectId) await loadProjectDetail(selectedProjectId);
    } catch (error) {
      message.error(error.message);
    } finally {
      setSyncLoading(false);
    }
  }

  async function syncOne(id) {
    setSyncLoading(true);
    try {
      await request(`/market/sync/${id}`, { method: 'POST' });
      message.success('单项目同步完成');
      await loadProjects(false);
      await loadProjectDetail(id);
    } catch (error) {
      message.error(error.message);
    } finally {
      setSyncLoading(false);
    }
  }

  function openEdit(record) {
    setEditRecord(record);
    setEditOpen(true);
  }

  async function removeProject(id) {
    modal.confirm({
      title: '确认删除项目',
      content: '删除后会清空该项目的持仓、指标和信号记录，继续吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      async onOk() {
        try {
          await request(`/projects/${id}`, { method: 'DELETE' });
          message.success('项目已删除');
          await loadProjects();
        } catch (error) {
          message.error(error.message || '删除失败');
        }
      }
    });
  }

  useEffect(() => {
    if (token) loadProjects();
  }, [token]);

  const metrics = useMemo(() => {
    const invested = projects.reduce((sum, item) => sum + Number(item.total_invested || 0), 0);
    const value = projects.reduce((sum, item) => sum + Number(item.position_value || 0), 0);
    return {
      total: projects.length,
      enabled: projects.filter((item) => Number(item.status) === 1).length,
      invested,
      value
    };
  }, [projects]);

  const projectColumns = [
    { title: '项目编码', dataIndex: 'project_code', width: 180 },
    { title: '交易对', dataIndex: 'symbol', width: 110 },
    { title: '周期', dataIndex: 'period', width: 80 },
    { title: '状态', dataIndex: 'status', width: 90, render: (_, row) => statusTag(row.status) },
    { title: '最新信号', dataIndex: 'latest_signal_action', width: 110, render: (_, row) => signalTag(row.latest_signal_action) },
    { title: '当前市值', dataIndex: 'position_value', width: 120, render: (_, row) => money(row.position_value) },
    {
      title: '操作', key: 'actions', width: 190,
      render: (_, row) => (
        <Space wrap size={4}>
          <Button size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>编辑</Button>
          <Button size="small" onClick={(e) => { e.stopPropagation(); syncOne(row.id); }}>同步</Button>
          <Button size="small" danger onClick={(e) => { e.stopPropagation(); removeProject(row.id); }}>删除</Button>
        </Space>
      )
    }
  ];

  const signalColumns = [
    { title: '时间', dataIndex: 'signal_time', render: (_, row) => formatTime(row.signal_time), width: 180 },
    { title: '动作', dataIndex: 'action', render: (_, row) => signalTag(row.action), width: 90 },
    { title: '金额/数量', dataIndex: 'amount', width: 120 },
    { title: '价格', dataIndex: 'price', width: 120 }
  ];

  const indicatorColumns = [
    { title: 'K线时间', dataIndex: 'candle_time', render: (_, row) => formatTime(row.candle_time), width: 180 },
    { title: '价格', dataIndex: 'price', width: 100 },
    { title: 'DIF', dataIndex: 'dif', width: 100 },
    { title: 'DEA', dataIndex: 'dea', width: 100 }
  ];

  if (!token) {
    return <LoginView onLogin={handleLogin} loading={loginLoading} />;
  }

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-header-inner">
          <div className="brand-block">
            <Space align="center">
              <BarChartOutlined className="brand-icon" />
              <div>
                <div className="brand-title">LongRoot Pro</div>
                <div className="brand-subtitle">Ant Design 响应式控制台</div>
              </div>
            </Space>
          </div>

          <Space wrap className="header-actions">
            <Text className="user-chip">{currentUser?.username || 'admin'}</Text>
            <Button icon={<ReloadOutlined />} onClick={() => loadProjects()}>刷新</Button>
            <Button type="primary" icon={<SyncOutlined />} loading={syncLoading} onClick={syncAll}>同步全部</Button>
            <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建项目</Button>
            <Button danger onClick={() => logout()}>退出</Button>
          </Space>
        </div>
      </Header>

      <Content className="app-content">
        <div className="page-shell">
          <div className="page-title-block">
            <Title level={mobile ? 4 : 2} style={{ marginBottom: 4 }}>LongRoot 金融控制台</Title>
            <Text type="secondary">已按全部前端页面统一做响应式重排：登录、统计、项目列表、详情、信号、指标、弹窗。</Text>
          </div>

          <MetricGrid metrics={metrics} />

          <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
            <Col xs={24} xl={14}>
              <Card title="项目列表" loading={projectLoading} className="panel-card">
                {mobile ? (
                  <ProjectCards
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onSelect={loadProjectDetail}
                    onEdit={openEdit}
                    onSync={syncOne}
                    onDelete={removeProject}
                  />
                ) : (
                  <Table
                    rowKey="id"
                    columns={projectColumns}
                    dataSource={projects}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 980 }}
                    rowClassName={(record) => (record.id === selectedProjectId ? 'selected-row' : '')}
                    onRow={(record) => ({ onClick: () => loadProjectDetail(record.id) })}
                  />
                )}
              </Card>
            </Col>

            <Col xs={24} xl={10}>
              <Card title="项目详情" loading={detailLoading} className="panel-card">
                {projectDetail ? (
                  <Descriptions column={1} size={mobile ? 'small' : 'default'}>
                    <Descriptions.Item label="项目编码">{projectDetail.project_code}</Descriptions.Item>
                    <Descriptions.Item label="交易对">{projectDetail.symbol}</Descriptions.Item>
                    <Descriptions.Item label="周期">{projectDetail.period}</Descriptions.Item>
                    <Descriptions.Item label="状态">{statusTag(projectDetail.status)}</Descriptions.Item>
                    <Descriptions.Item label="每次买入金额">{money(projectDetail.buy_amount_per_order)}</Descriptions.Item>
                    <Descriptions.Item label="限红倍数">{money(projectDetail.take_profit_multiple)}</Descriptions.Item>
                    <Descriptions.Item label="限红金额">{money(projectDetail.take_profit_amount)}</Descriptions.Item>
                    <Descriptions.Item label="卖出除数">{money(projectDetail.sell_divisor)}</Descriptions.Item>
                    <Descriptions.Item label="持仓数量">{money(projectDetail.position_qty, 8)}</Descriptions.Item>
                    <Descriptions.Item label="累计投入">{money(projectDetail.total_invested)}</Descriptions.Item>
                    <Descriptions.Item label="累计变现">{money(projectDetail.total_realized)}</Descriptions.Item>
                    <Descriptions.Item label="当前市值">{money(projectDetail.position_value)}</Descriptions.Item>
                    <Descriptions.Item label="最大敞口">{money(projectDetail.max_exposure)}</Descriptions.Item>
                    <Descriptions.Item label="最大损失">{money(projectDetail.max_loss)}</Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Text type="secondary">先选择一个项目</Text>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
            <Col xs={24} xl={12}>
              <Card title="最近交易信号" className="panel-card">
                {mobile ? (
                  <SignalList data={projectSignals} />
                ) : (
                  <Table rowKey="id" columns={signalColumns} dataSource={projectSignals} pagination={false} scroll={{ x: 720 }} />
                )}
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card title="最近指标" className="panel-card">
                {mobile ? (
                  <IndicatorList data={projectIndicators} />
                ) : (
                  <Table rowKey="id" columns={indicatorColumns} dataSource={projectIndicators} pagination={false} scroll={{ x: 720 }} />
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </Content>

      <BetaSchemaForm
        title="新建项目"
        layoutType="ModalForm"
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnClose: true }}
        initialValues={defaultProjectForm()}
        columns={projectFormColumns()}
        onFinish={async (values) => {
          try {
            await request('/projects', { method: 'POST', body: JSON.stringify(values) });
            message.success('项目已创建');
            setCreateOpen(false);
            await loadProjects();
            return true;
          } catch (error) {
            message.error(error.message);
            return false;
          }
        }}
      />

      <BetaSchemaForm
        title="编辑项目"
        layoutType="ModalForm"
        open={editOpen}
        onOpenChange={setEditOpen}
        modalProps={{ destroyOnClose: true }}
        initialValues={{
          ...defaultProjectForm(),
          ...editRecord,
          buyAmountPerOrder: Number(editRecord?.buy_amount_per_order ?? editRecord?.buyAmountPerOrder ?? 100),
          takeProfitMultiple: Number(editRecord?.take_profit_multiple ?? editRecord?.takeProfitMultiple ?? 2),
          sellDivisor: Number(editRecord?.sell_divisor ?? editRecord?.sellDivisor ?? 4),
          status: Number(editRecord?.status ?? 1)
        }}
        columns={projectFormColumns()}
        onFinish={async (values) => {
          try {
            await request(`/projects/${editRecord.id}`, { method: 'PUT', body: JSON.stringify(values) });
            message.success('项目已更新');
            setEditOpen(false);
            await loadProjects(false);
            await loadProjectDetail(editRecord.id);
            return true;
          } catch (error) {
            message.error(error.message);
            return false;
          }
        }}
      />
    </Layout>
  );
}
