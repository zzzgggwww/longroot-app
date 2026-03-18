/**
 * 模块说明：已登录应用容器：管理项目/用户数据加载、弹窗状态和主要交互动作。
 */
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { App as AntApp, Spin } from 'antd';
import { API_BASE, USER_KEY } from '../../lib/constants';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { formatTime } from '../../lib/formatters';

const DashboardShell = lazy(() => import('../dashboard/DashboardShell'));
const ProjectFormModal = lazy(() => import('../projects/ProjectFormModal'));

export default function AuthenticatedApp({ token, currentUser, setCurrentUser, onLogout }) {
  const { message, modal } = AntApp.useApp();

  // 这里集中管理控制台运行态：项目列表、用户列表、详情数据、弹窗和加载状态。
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [projectSignals, setProjectSignals] = useState([]);
  const [projectIndicators, setProjectIndicators] = useState([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [projectError, setProjectError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [syncMetaMap, setSyncMetaMap] = useState({});

  const metrics = useProjectMetrics(projects);

  // 统一请求封装：自动补 Authorization，并在 401 时触发退出登录。
  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    };
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) onLogout(false);
      throw new Error(data.message || `请求失败: ${response.status}`);
    }
    return data;
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

  async function loadUsers() {
    if (currentUser?.role !== 'admin') {
      setUsers([]);
      return;
    }
    setUserLoading(true);
    try {
      const data = await request('/users');
      setUsers(data);
    } catch (error) {
      message.error(error.message);
    } finally {
      setUserLoading(false);
    }
  }

  // 加载项目列表；首次进入时默认自动选中第一条项目并联动加载详情。
  async function loadProjects(selectFirst = true) {
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

  async function handleCreateUser(values) {
    try {
      await request('/users', { method: 'POST', body: JSON.stringify(values) });
      message.success('用户已创建');
      await loadUsers();
      return true;
    } catch (error) {
      message.error(error.message);
      return false;
    }
  }

  async function handleUpdateUser(record, values) {
    try {
      await request(`/users/${record.id}`, { method: 'PUT', body: JSON.stringify(values) });
      message.success('用户信息已更新');
      await loadUsers();
      return true;
    } catch (error) {
      message.error(error.message);
      return false;
    }
  }

  async function handleChangeUserPassword(record, values) {
    try {
      await request(`/users/${record.id}/password`, { method: 'PUT', body: JSON.stringify(values) });
      message.success('密码已更新');
      return true;
    } catch (error) {
      message.error(error.message);
      return false;
    }
  }

  function buildBackfillMessage(result) {
    const count = Number(result?.backfilledCandles || 0);
    if (count <= 0) return '无缺失区间，本次仅刷新最新数据';
    const fromText = result?.lastSyncedAt ? `，从 ${formatTime(result.lastSyncedAt)} 之后开始补算` : '';
    return `自动回填 ${count} 根 candle${fromText}`;
  }

  async function syncAll() {
    setSyncLoading(true);
    try {
      const data = await request('/market/sync', { method: 'POST' });
      const okResults = (data.results || []).filter((item) => item.ok);
      const okCount = okResults.length;
      const failCount = (data.results || []).length - okCount;
      const backfilledTotal = okResults.reduce((sum, item) => sum + Number(item?.result?.backfilledCandles || 0), 0);
      const failedItems = (data.results || []).filter((item) => !item.ok);
      message.success(`同步完成，成功 ${okCount} 个项目${failCount > 0 ? `，失败 ${failCount} 个` : ''}；本次共回填 ${backfilledTotal} 根 candle`);
      if (failedItems.length) {
        message.warning(`失败原因：${failedItems.map((item) => `${item.projectCode || item.projectId} - ${item.error}`).join('；')}`);
      }
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
      const result = await request(`/market/sync/${id}`, { method: 'POST' });
      setSyncMetaMap((prev) => ({
        ...prev,
        [id]: {
          latest_sync_at: new Date().toISOString(),
          latest_backfilled_candles: Number(result?.backfilledCandles || 0)
        }
      }));
      message.success(`单项目同步完成：${buildBackfillMessage(result)}`);
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
    loadProjects();
    loadUsers();
  }, [currentUser?.role]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    }
  }, [currentUser]);

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
          users={users}
          userLoading={userLoading}
          onRefreshUsers={loadUsers}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
          onChangeUserPassword={handleChangeUserPassword}
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
          onLogout={() => onLogout()}
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
