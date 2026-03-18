/**
 * 模块说明：市场活动面板：展示最近交易信号和最近指标两块明细数据。
 */
import React from 'react';
import { Card, Col, Row, Table, Typography } from 'antd';
import { IndicatorList, SignalList } from '../projects/ProjectDataLists';
import { formatTime, money, signalTag, signalTradeMetrics } from '../../lib/formatters';

const { Text } = Typography;

export default function MarketActivityPanels({ mobile, projectSignals, projectIndicators }) {
  const signalColumns = [
    { title: '时间', dataIndex: 'signal_time', render: (_, row) => formatTime(row.signal_time), width: 180 },
    { title: '动作', dataIndex: 'action', render: (_, row) => signalTag(row.action), width: 90 },
    {
      title: '金额', dataIndex: 'amount', width: 120, align: 'right',
      render: (_, row) => row.action === 'HOLD' ? '-' : <Text className="finance-number">{money(signalTradeMetrics(row).amount)}</Text>
    },
    {
      title: '数量', dataIndex: 'quantity', width: 140, align: 'right',
      render: (_, row) => row.action === 'HOLD' ? '-' : <Text className="finance-number">{money(signalTradeMetrics(row).quantity, 8)}</Text>
    },
    {
      title: '手续费', dataIndex: 'fee', width: 120, align: 'right',
      render: (_, row) => row.action === 'HOLD' ? '-' : <Text className="finance-number finance-number-fee">{money(signalTradeMetrics(row).fee, 6)}</Text>
    },
    {
      title: '净额', dataIndex: 'net_amount', width: 120, align: 'right',
      render: (_, row) => row.action === 'HOLD' ? '-' : <Text className="finance-number">{money(signalTradeMetrics(row).netAmount, 4)}</Text>
    },
    { title: '价格', dataIndex: 'price', width: 120, align: 'right', render: (_, row) => <Text className="finance-number">{money(row.price, 4)}</Text> }
  ];

  const indicatorColumns = [
    { title: 'K线时间', dataIndex: 'candle_time', render: (_, row) => formatTime(row.candle_time), width: 180 },
    { title: '价格', dataIndex: 'price', width: 110, align: 'right', render: (_, row) => <Text className="finance-number">{money(row.price, 4)}</Text> },
    { title: 'DIF', dataIndex: 'dif', width: 110, align: 'right', render: (_, row) => <Text className="finance-number">{money(row.dif, 6)}</Text> },
    { title: 'DEA', dataIndex: 'dea', width: 110, align: 'right', render: (_, row) => <Text className="finance-number">{money(row.dea, 6)}</Text> }
  ];

  return (
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
  );
}
