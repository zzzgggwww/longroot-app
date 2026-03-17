import React from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Grid,
  Layout,
  Row,
  Space,
  Table,
  Typography
} from 'antd';
import {
  BarChartOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined
} from '@ant-design/icons';
import MetricGrid from './MetricGrid';
import ProjectCards from '../projects/ProjectCards';
import { IndicatorList, SignalList } from '../projects/ProjectDataLists';
import { formatTime, money, signalTag, signalTradeMetrics, statusTag } from '../../lib/formatters';
import { calcProjectProfit, calcProjectProfitRate } from '../../hooks/useProjectMetrics';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

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

  const projectColumns = [
    { title: '项目编码', dataIndex: 'project_code', width: 180 },
    { title: '交易对', dataIndex: 'symbol', width: 110 },
    { title: '周期', dataIndex: 'period', width: 80 },
    { title: '状态', dataIndex: 'status', width: 90, render: (_, row) => statusTag(row.status) },
    { title: '最新信号', dataIndex: 'latest_signal_action', width: 110, render: (_, row) => signalTag(row.latest_signal_action) },
    { title: '当前市值', dataIndex: 'position_value', width: 120, render: (_, row) => money(row.position_value) },
    {
      title: '实际盈亏', dataIndex: 'profit', width: 120,
      render: (_, row) => {
        const profit = calcProjectProfit(row);
        return <Text style={{ color: profit > 0 ? '#16a34a' : profit < 0 ? '#dc2626' : undefined }}>{`${profit > 0 ? '+' : ''}${money(profit)}`}</Text>;
      }
    },
    {
      title: '盈亏率', dataIndex: 'profit_rate', width: 110,
      render: (_, row) => {
        const profitRate = calcProjectProfitRate(row) * 100;
        return <Text style={{ color: profitRate > 0 ? '#16a34a' : profitRate < 0 ? '#dc2626' : undefined }}>{`${profitRate > 0 ? '+' : ''}${profitRate.toFixed(2)}%`}</Text>;
      }
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
              icon={enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
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

  const signalColumns = [
    { title: '时间', dataIndex: 'signal_time', render: (_, row) => formatTime(row.signal_time), width: 180 },
    { title: '动作', dataIndex: 'action', render: (_, row) => signalTag(row.action), width: 90 },
    {
      title: '金额', dataIndex: 'amount', width: 120,
      render: (_, row) => row.action === 'HOLD' ? '-' : money(signalTradeMetrics(row).amount)
    },
    {
      title: '数量', dataIndex: 'quantity', width: 140,
      render: (_, row) => row.action === 'HOLD' ? '-' : money(signalTradeMetrics(row).quantity, 8)
    },
    { title: '价格', dataIndex: 'price', width: 120, render: (_, row) => money(row.price, 4) }
  ];

  const indicatorColumns = [
    { title: 'K线时间', dataIndex: 'candle_time', render: (_, row) => formatTime(row.candle_time), width: 180 },
    { title: '价格', dataIndex: 'price', width: 100 },
    { title: 'DIF', dataIndex: 'dif', width: 100 },
    { title: 'DEA', dataIndex: 'dea', width: 100 }
  ];

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
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>刷新</Button>
            <Button type="primary" icon={<SyncOutlined />} loading={syncLoading} onClick={onSyncAll}>同步全部</Button>
            <Button type="primary" ghost icon={<PlusOutlined />} onClick={onCreate}>新建项目</Button>
            <Button danger onClick={onLogout}>退出</Button>
          </Space>
        </div>
      </Header>

      <Content className="app-content">
        <div className="page-shell">
          <div className="page-title-block">
            <Title level={mobile ? 4 : 2} style={{ marginBottom: 4 }}>LongRoot 金融控制台</Title>
            <Text type="secondary">这次补上了一键启用/停用和面板内错误态，日常操作比之前顺手不少。</Text>
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
                ) : projectDetail ? (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Space wrap>
                      {statusTag(projectDetail.status)}
                      <Button
                        size="small"
                        loading={statusLoadingId === projectDetail.id}
                        icon={Number(projectDetail.status) === 1 ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={() => onToggleStatus(projectDetail)}
                      >
                        {Number(projectDetail.status) === 1 ? '停用该项目' : '启用该项目'}
                      </Button>
                      <Button size="small" onClick={() => onEdit(projectDetail)}>编辑参数</Button>
                    </Space>

                    <Descriptions column={mobile ? 1 : 2} size={mobile ? 'small' : 'default'}>
                      <Descriptions.Item label="项目编码">{projectDetail.project_code}</Descriptions.Item>
                      <Descriptions.Item label="交易对">{projectDetail.symbol}</Descriptions.Item>
                      <Descriptions.Item label="周期">{projectDetail.period}</Descriptions.Item>
                      <Descriptions.Item label="每次买入金额">{money(projectDetail.buy_amount_per_order)}</Descriptions.Item>
                      <Descriptions.Item label="限红倍数">{money(projectDetail.take_profit_multiple)}</Descriptions.Item>
                      <Descriptions.Item label="限红金额">{money(projectDetail.take_profit_amount)}</Descriptions.Item>
                      <Descriptions.Item label="卖出除数">{money(projectDetail.sell_divisor)}</Descriptions.Item>
                      <Descriptions.Item label="持仓数量">{money(projectDetail.position_qty, 8)}</Descriptions.Item>
                      <Descriptions.Item label="累计投入">{money(projectDetail.total_invested)}</Descriptions.Item>
                      <Descriptions.Item label="累计变现">{money(projectDetail.total_realized)}</Descriptions.Item>
                      <Descriptions.Item label="当前市值">{money(projectDetail.position_value)}</Descriptions.Item>
                      <Descriptions.Item label="实际盈亏">
                        <Text style={{ color: calcProjectProfit(projectDetail) > 0 ? '#16a34a' : calcProjectProfit(projectDetail) < 0 ? '#dc2626' : undefined }}>
                          {`${calcProjectProfit(projectDetail) > 0 ? '+' : ''}${money(calcProjectProfit(projectDetail))}`}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="盈亏率">
                        <Text style={{ color: calcProjectProfitRate(projectDetail) > 0 ? '#16a34a' : calcProjectProfitRate(projectDetail) < 0 ? '#dc2626' : undefined }}>
                          {`${calcProjectProfitRate(projectDetail) > 0 ? '+' : ''}${(calcProjectProfitRate(projectDetail) * 100).toFixed(2)}%`}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="最大敞口">{money(projectDetail.max_exposure)}</Descriptions.Item>
                      <Descriptions.Item label="最大损失">{money(projectDetail.max_loss)}</Descriptions.Item>
                    </Descriptions>
                  </Space>
                ) : (
                  <Empty description="先选择一个项目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                  <Table rowKey="id" columns={signalColumns} dataSource={projectSignals} pagination={false} scroll={{ x: 720 }} locale={{ emptyText: '暂无信号' }} />
                )}
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card title="最近指标" className="panel-card">
                {mobile ? (
                  <IndicatorList data={projectIndicators} />
                ) : (
                  <Table rowKey="id" columns={indicatorColumns} dataSource={projectIndicators} pagination={false} scroll={{ x: 720 }} locale={{ emptyText: '暂无指标' }} />
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
}
