/**
 * 模块说明：指标总览面板：以卡片形式展示项目数、资金口径和收益口径汇总数据。
 */
import React from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { money } from '../../lib/formatters';

const { Text } = Typography;

function pnlStyle(value) {
  return { color: value > 0 ? '#16a34a' : value < 0 ? '#dc2626' : undefined };
}

// 单个指标卡组件：统一标题、数值、附加口径说明的展示结构。
function MetricCard({ title, value, precision = 2, prefix, suffix, valueStyle, extra }) {
  return (
    <Card className="metric-card" bordered={false}>
      <Statistic
        title={<span className="metric-card-title">{title}</span>}
        value={value}
        precision={precision}
        prefix={prefix}
        suffix={suffix}
        valueStyle={valueStyle}
      />
      {extra ? <Text className="metric-card-extra">{extra}</Text> : null}
    </Card>
  );
}

export default function MetricGrid({ metrics }) {
  const totalProfit = Number(money(metrics.profit));
  const netProfit = Number(money(metrics.netProfit));
  const realizedProfit = Number(money(metrics.realizedProfit));
  const unrealizedProfit = Number(money(metrics.unrealizedProfit));
  const profitRate = Number((Number(metrics.profitRate || 0) * 100).toFixed(2));

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="项目总数" value={metrics.total} precision={0} extra="当前纳入监控的策略项目数" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="启用项目" value={metrics.enabled} precision={0} extra="已开启自动同步与策略运行" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="累计投入" value={Number(money(metrics.invested))} extra="含买入侧手续费成本" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="累计变现" value={Number(money(metrics.realized))} extra="卖出净回款累计" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="当前市值" value={Number(money(metrics.value))} extra="按当前持仓估值" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="当前持仓成本" value={Number(money(metrics.cost))} extra="未平仓部分累计成本" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="累计手续费" value={Number(money(metrics.fees))} precision={4} valueStyle={{ color: '#fbbf24' }} extra="买卖双边手续费合计" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="已实现收益" value={realizedProfit} valueStyle={pnlStyle(realizedProfit)} prefix={realizedProfit > 0 ? '+' : ''} extra="已闭合交易收益" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="未实现收益" value={unrealizedProfit} valueStyle={pnlStyle(unrealizedProfit)} prefix={unrealizedProfit > 0 ? '+' : ''} extra="浮盈浮亏" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="总收益" value={totalProfit} valueStyle={pnlStyle(totalProfit)} prefix={totalProfit > 0 ? '+' : ''} extra="已实现 + 未实现" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="净收益(校验)" value={netProfit} valueStyle={pnlStyle(netProfit)} prefix={netProfit > 0 ? '+' : ''} extra="变现 + 市值 - 投入" />
      </Col>
      <Col xs={24} sm={12} lg={8} xl={6}>
        <MetricCard title="收益率" value={profitRate} suffix="%" valueStyle={pnlStyle(totalProfit)} prefix={profitRate > 0 ? '+' : ''} extra="总收益 / 累计投入" />
      </Col>
    </Row>
  );
}
