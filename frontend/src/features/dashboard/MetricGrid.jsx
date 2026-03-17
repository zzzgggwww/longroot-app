import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { money } from '../../lib/formatters';

export default function MetricGrid({ metrics }) {
  const profit = Number(money(metrics.profit));
  const profitRate = Number((Number(metrics.profitRate || 0) * 100).toFixed(2));
  const valueStyle = { color: profit > 0 ? '#16a34a' : profit < 0 ? '#dc2626' : undefined };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={8} xl={8}>
        <Card className="metric-card"><Statistic title="项目总数" value={metrics.total} /></Card>
      </Col>
      <Col xs={24} sm={12} lg={8} xl={8}>
        <Card className="metric-card"><Statistic title="启用项目" value={metrics.enabled} /></Card>
      </Col>
      <Col xs={24} sm={12} lg={8} xl={8}>
        <Card className="metric-card"><Statistic title="累计投入" value={Number(money(metrics.invested))} precision={2} /></Card>
      </Col>
      <Col xs={24} sm={12} lg={8} xl={8}>
        <Card className="metric-card"><Statistic title="当前持仓市值" value={Number(money(metrics.value))} precision={2} /></Card>
      </Col>
      <Col xs={24} sm={12} lg={8} xl={8}>
        <Card className="metric-card"><Statistic title="累计手续费" value={Number(money(metrics.fees))} precision={4} /></Card>
      </Col>
      <Col xs={24} sm={12} lg={8} xl={8}>
        <Card className="metric-card">
          <Statistic
            title="实际盈亏"
            value={profit}
            precision={2}
            valueStyle={valueStyle}
            prefix={profit > 0 ? '+' : ''}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8} xl={8}>
        <Card className="metric-card">
          <Statistic
            title="盈亏率"
            value={profitRate}
            precision={2}
            suffix="%"
            valueStyle={valueStyle}
            prefix={profitRate > 0 ? '+' : ''}
          />
        </Card>
      </Col>
    </Row>
  );
}
