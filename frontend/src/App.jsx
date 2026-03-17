import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { App as AntApp } from 'antd';
import LoginView from './features/auth/LoginView';
import { API_BASE, TOKEN_KEY, USER_KEY } from './lib/constants';
import { safeParse } from './lib/formatters';
import { useProjectMetrics } from './hooks/useProjectMetrics';

const DashboardShell = lazy(() => import('./features/dashboard/DashboardShell'));
const ProjectFormModal = lazy(() => import('./features/projects/ProjectFormModal'));

export default function App() {
  const { message, modal } = AntApp.useApp();

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
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [projectError, setProjectError] = useState('');
  const [detailError, setDetailError] = useState('');

  const metrics = useProjectMetrics(projects);

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

  function resetProjectState() {
    setProjects([]);
    setSelectedProjectId(null);
    setProjectDetail(null);
    setProjectSignals([]);
    setProjectIndicators([]);
    setProjectError('');
    setDetailError('');
  }

  function logout(showMessage = true) {
    setToken('');
    setCurrentUser(null);
    resetProjectState();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (showMessage) message.success('已退出登录');
  }

  async function loadProjectDetail(id) {
    if (!id) return;
    setDetailLoading(true);
    setDetailError('');
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
      setDetailError(error.message);
      setProjectDetail(null);
      setProjectSignals([]);
      setProjectIndicators([]);
      message.error(error.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadProjects(selectFirst = true) {
    if (!token) return;
    setProjectLoading(true);
    setProjectError('');
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
        setDetailError('');
      }
    } catch (error) {
      setProjectError(error.message);
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
      const failCount = (data.results || []).length - okCount;
      message.success(`同步完成，成功 ${okCount} 个项目${failCount > 0 ? `，失败 ${failCount} 个` : ''}`);
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

  async function toggleProjectStatus(record) {
    const nextStatus = Number(record.status) === 1 ? 0 : 1;
    const actionText = nextStatus === 1 ? '启用' : '停用';
    setStatusLoadingId(record.id);
    try {
      await request(`/projects/${record.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      message.success(`项目已${actionText}`);
      await loadProjects(false);
      if (selectedProjectId === record.id) {
        await loadProjectDetail(record.id);
      }
    } catch (error) {
      message.error(error.message || `${actionText}失败`);
    } finally {
      setStatusLoadingId(null);
    }
  }

  async function handleCreate(values) {
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
  }

  async function handleUpdate(values) {
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
  }

  function removeProject(id) {
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

  if (!token) {
    return <LoginView onLogin={handleLogin} loading={loginLoading} />;
  }

  const editInitialValues = editRecord ? {
    ...editRecord,
    buyAmountPerOrder: Number(editRecord?.buy_amount_per_order ?? editRecord?.buyAmountPerOrder ?? 100),
    takeProfitMultiple: Number(editRecord?.take_profit_multiple ?? editRecord?.takeProfitMultiple ?? 2),
    sellDivisor: Number(editRecord?.sell_divisor ?? editRecord?.sellDivisor ?? 4),
    status: Number(editRecord?.status ?? 1)
  } : undefined;

  return (
    <>
      <Suspense fallback={<div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><Spin size="large" /></div>}>
        <DashboardShell
          currentUser={currentUser}
          projects={projects}
          selectedProjectId={selectedProjectId}
          projectDetail={projectDetail}
          projectSignals={projectSignals}
          projectIndicators={projectIndicators}
          projectLoading={projectLoading}
          detailLoading={detailLoading}
          syncLoading={syncLoading}
          statusLoadingId={statusLoadingId}
          projectError={projectError}
          detailError={detailError}
          metrics={metrics}
          onRefresh={() => loadProjects()}
          onSyncAll={syncAll}
          onCreate={() => setCreateOpen(true)}
          onLogout={() => logout()}
          onLoadProjectDetail={loadProjectDetail}
          onEdit={openEdit}
          onSyncOne={syncOne}
          onToggleStatus={toggleProjectStatus}
          onDelete={removeProject}
        />
      </Suspense>

      <Suspense fallback={null}>
        {(createOpen || editOpen) ? (
          <>
            <ProjectFormModal
              title="新建项目"
              open={createOpen}
              onOpenChange={setCreateOpen}
              onFinish={handleCreate}
            />
            <ProjectFormModal
              title="编辑项目"
              open={editOpen}
              onOpenChange={setEditOpen}
              initialValues={editInitialValues}
              onFinish={handleUpdate}
            />
          </>
        ) : null}
      </Suspense>
    </>
  );
}
