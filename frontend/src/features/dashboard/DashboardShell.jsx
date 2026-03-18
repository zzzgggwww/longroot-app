/**
 * 模块说明：控制台主框架：负责页面布局、头部操作区、项目列表和各区域组合。
 */
import React, { Suspense, lazy } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Grid,
  Layout,
  Row,
  Space,
  Table,
  Typography
} from 'antd';
import MetricGrid from './MetricGrid';
import { AddGlyph, BrandMark, PauseGlyph, PlayGlyph, RefreshGlyph, SyncGlyph } from '../../lib/icons';
import ProjectCards from '../projects/ProjectCards';
import { money, signalTag, statusTag } from '../../lib/formatters';
import { calcProjectProfit, calcProjectProfitRate } from '../../hooks/useProjectMetrics';

const ProjectDetailPanel = lazy(() => import('./ProjectDetailPanel'));
const MarketActivityPanels = lazy(() => import('./MarketActivityPanels'));

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

function pnlClass(value) {
  return value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
}

function renderPnl(value, suffix = '') {
  return (
    <Text className={`finance-number finance-number-${pnlClass(value)}`}>
      {`${value > 0 ? '+' : ''}${suffix ? `${value.toFixed(2)}${suffix}` : money(value)}`}
    </Text>
  );
}

export default function DashboardShell(props) {
  const {
    currentUser,
    projects,
    selectedProjectId,
    projectDetail,
    projectSignals,
    projectIndicators,
    projectLoading,
    detailLoading,
    syncLoading,
    statusLoadingId,
    projectError,
    detailError,
    metrics,
    onRefresh,
    onSyncAll,
    onCreate,
    onLogout,
    onLoadProjectDetail,
    onEdit,
    onSyncOne,
    onToggleStatus,
    onDelete
  } = props;

  const screens = useBreakpoint();
  const mobile = !screens.lg;

  // 桌面端项目列表列定义：核心强调状态、资金口径、收益口径和常用操作。
  const projectColumns = [
    { title: '项目编码', dataIndex: 'project_code', width: 180 },
    { title: '交易对', dataIndex: 'symbol', width: 110 },
    { title: '周期', dataIndex: 'period', width: 80 },
    { title: '状态', dataIndex: 'status', width: 90, render: (_, row) => statusTag(row.status) },
    { title: '最新信号', dataIndex: 'latest_signal_action', width: 110, render: (_, row) => signalTag(row.latest_signal_action) },
    { title: '当前市值', dataIndex: 'position_value', width: 130, align: 'right', render: (_, row) => <Text className="finance-number">{money(row.position_value)}</Text> },
    { title: '累计手续费', dataIndex: 'total_fees', width: 130, align: 'right', render: (_, row) => <Text className="finance-number finance-number-fee">{money(row.total_fees, 4)}</Text> },
    {
      title: '总收益', dataIndex: 'profit', width: 130, align: 'right',
      render: (_, row) => renderPnl(calcProjectProfit(row))
    },
    {
      title: '盈亏率', dataIndex: 'profit_rate', width: 120, align: 'right',
      render: (_, row) => renderPnl(calcProjectProfitRate(row) * 100, '%')
    },
    {
      title: '操作', key: 'actions', width: 280,
      render: (_, row) => {
        const enabled = Number(row.status) === 1;
        return (
          <Space wrap size={4}>
            <Button size="small" onClick={(e) => { e.stopPropagation(); onEdit(row); }}>编辑</Button>
            <Button size="small" disabled={!enabled} onClick={(e) => { e.stopPropagation(); onSyncOne(row.id); }}>同步</Button>
            <Button
              size="small"
              loading={statusLoadingId === row.id}
              icon={enabled ? <PauseGlyph /> : <PlayGlyph />}
              onClick={(e) => { e.stopPropagation(); onToggleStatus(row); }}
            >
              {enabled ? '停用' : '启用'}
            </Button>
            <Button size="small" danger onClick={(e) => { e.stopPropagation(); onDelete(row.id); }}>删除</Button>
          </Space>
        );
      }
    }
  ];

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-header-inner">
          <div className="brand-block">
            <Space align="center">
              <BrandMark className="brand-icon" />
              <div>
                <div className="brand-title">LongRoot Pro</div>
                <div className="brand-subtitle">Ant Design 响应式控制台</div>
              </div>
            </Space>
          </div>

          <Space wrap className="header-actions">
            <Text className="user-chip">{currentUser?.username || 'admin'}</Text>
            <Button icon={<RefreshGlyph />} onClick={onRefresh}>刷新</Button>
            <Button type="primary" icon={<SyncGlyph />} loading={syncLoading} onClick={onSyncAll}>同步全部</Button>
            <Button type="primary" ghost icon={<AddGlyph />} onClick={onCreate}>新建项目</Button>
            <Button danger onClick={onLogout}>退出</Button>
          </Space>
        </div>
      </Header>

      <Content className="app-content">
        <div className="page-shell">
          <div className="page-title-block finance-title-block">
            <div>
              <Title level={mobile ? 4 : 2} className="page-main-title" style={{ marginBottom: 4 }}>LongRoot 金融控制台</Title>
              <Text className="page-main-subtitle">聚焦持仓、现金流与收益拆解，信息表达更接近真实交易面板。</Text>
            </div>
            <div className="market-session-chip">MARKET MONITOR</div>
          </div>

          <MetricGrid metrics={metrics} />

          <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
            <Col xs={24}>
              <Card title="项目列表" loading={projectLoading} className="panel-card panel-card-table">
                {projectError ? (
                  <Alert
                    type="error"
                    showIcon
                    message="项目列表加载失败"
                    description={projectError}
                    action={<Button size="small" onClick={onRefresh}>重试</Button>}
                  />
                ) : mobile ? (
                  <ProjectCards
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onSelect={onLoadProjectDetail}
                    onEdit={onEdit}
                    onSync={onSyncOne}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                    loading={statusLoadingId !== null}
                  />
                ) : (
                  <Table
                    rowKey="id"
                    columns={projectColumns}
                    dataSource={projects}
                    locale={{ emptyText: <Empty description="暂无项目，可先创建一个" /> }}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    scroll={{ x: 1280 }}
                    rowClassName={(record) => (record.id === selectedProjectId ? 'selected-row' : '')}
                    onRow={(record) => ({ onClick: () => onLoadProjectDetail(record.id) })}
                  />
                )}
              </Card>
            </Col>

            <Col xs={24}>
              <Card title="项目详情" loading={detailLoading} className="panel-card panel-card-detail">
                {detailError ? (
                  <Alert
                    type="warning"
                    showIcon
                    message="项目详情加载失败"
                    description={detailError}
                    action={selectedProjectId ? <Button size="small" onClick={() => onLoadProjectDetail(selectedProjectId)}>重试</Button> : null}
                  />
                ) : (
                  <Suspense fallback={null}>
                    <ProjectDetailPanel
                      mobile={mobile}
                      projectDetail={projectDetail}
                      statusLoadingId={statusLoadingId}
                      onToggleStatus={onToggleStatus}
                      onEdit={onEdit}
                    />
                  </Suspense>
                )}
              </Card>
            </Col>
          </Row>

          <Suspense fallback={null}>
            <MarketActivityPanels
              mobile={mobile}
              projectSignals={projectSignals}
              projectIndicators={projectIndicators}
            />
          </Suspense>
        </div>
      </Content>
    </Layout>
  );
}
