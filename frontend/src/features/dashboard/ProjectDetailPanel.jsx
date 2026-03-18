/**
 * 模块说明：项目详情面板：展示单个项目的参数、资金成本和收益拆解。
 */
import React from 'react';
import { Button, Descriptions, Divider, Empty, Space, Tooltip, Typography } from 'antd';
import { PauseGlyph, PlayGlyph } from '../../lib/icons';
import { money, statusTag } from '../../lib/formatters';
import {
  calcProjectNetProfit,
  calcProjectProfit,
  calcProjectProfitRate,
  calcProjectRealizedProfit,
  calcProjectUnrealizedProfit
} from '../../hooks/useProjectMetrics';

const { Text } = Typography;

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

export default function ProjectDetailPanel({ mobile, projectDetail, statusLoadingId, onToggleStatus, onEdit }) {
  if (!projectDetail) {
    return <Empty description="先选择一个项目" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap>
        {statusTag(projectDetail.status)}
        <Button
          size="small"
          loading={statusLoadingId === projectDetail.id}
          icon={Number(projectDetail.status) === 1 ? <PauseGlyph /> : <PlayGlyph />}
          onClick={() => onToggleStatus(projectDetail)}
        >
          {Number(projectDetail.status) === 1 ? '停用该项目' : '启用该项目'}
        </Button>
        <Button size="small" onClick={() => onEdit(projectDetail)}>编辑参数</Button>
      </Space>

      <div className="detail-section">
        <div className="detail-section-title">基础参数</div>
        <Descriptions column={mobile ? 1 : 2} size={mobile ? 'small' : 'default'}>
          <Descriptions.Item label="项目编码">{projectDetail.project_code}</Descriptions.Item>
          <Descriptions.Item label="交易对">{projectDetail.symbol}</Descriptions.Item>
          <Descriptions.Item label="周期">{projectDetail.period}</Descriptions.Item>
          <Descriptions.Item label="每次买入金额">{money(projectDetail.buy_amount_per_order)}</Descriptions.Item>
          <Descriptions.Item label="限红倍数">{money(projectDetail.take_profit_multiple)}</Descriptions.Item>
          <Descriptions.Item label="限红金额">{money(projectDetail.take_profit_amount)}</Descriptions.Item>
          <Descriptions.Item label="卖出除数">{money(projectDetail.sell_divisor)}</Descriptions.Item>
          <Descriptions.Item label="持仓数量">{money(projectDetail.position_qty, 8)}</Descriptions.Item>
        </Descriptions>
      </div>

      <Divider style={{ margin: '4px 0' }} />

      <div className="detail-section">
        <div className="detail-section-title">资金与成本</div>
        <div className="detail-section-tip">累计投入已含买入手续费，累计变现为扣除卖出手续费后的净回款。</div>
        <Descriptions column={mobile ? 1 : 2} size={mobile ? 'small' : 'default'}>
          <Descriptions.Item label="累计投入">{money(projectDetail.total_invested)}</Descriptions.Item>
          <Descriptions.Item label="累计变现">{money(projectDetail.total_realized)}</Descriptions.Item>
          <Descriptions.Item label="累计手续费">{money(projectDetail.total_fees)}</Descriptions.Item>
          <Descriptions.Item label="当前市值">{money(projectDetail.position_value)}</Descriptions.Item>
          <Descriptions.Item label="持仓成本">{money(projectDetail.position_cost)}</Descriptions.Item>
          <Descriptions.Item label="持仓均价">{money(projectDetail.avg_cost_price, 4)}</Descriptions.Item>
        </Descriptions>
      </div>

      <Divider style={{ margin: '4px 0' }} />

      <div className="detail-section">
        <div className="detail-section-title">收益拆解</div>
        <div className="detail-section-tip">总收益 = 已实现收益 + 未实现收益；净收益用于校验“变现 + 市值 - 投入”的现金口径。</div>
        <div className="finance-kpi-note-row">
          <div className="finance-kpi-note">
            <span className="label">收益来源</span>
            <span className="value">已实现 / 未实现双口径拆分</span>
          </div>
          <Tooltip title="净收益用于验证现金流口径，若和总收益存在差异，通常来自已实现收益字段与现金口径定义不同。">
            <div className="finance-kpi-note">
              <span className="label">校验口径</span>
              <span className="value">变现 + 市值 - 投入</span>
            </div>
          </Tooltip>
        </div>
        <div className="profit-strip">
          <div className="profit-strip-card">
            <div className="profit-strip-label">已实现收益</div>
            <div className={`profit-strip-value ${pnlClass(calcProjectRealizedProfit(projectDetail))}`}>{`${calcProjectRealizedProfit(projectDetail) > 0 ? '+' : ''}${money(calcProjectRealizedProfit(projectDetail))}`}</div>
          </div>
          <div className="profit-strip-card">
            <div className="profit-strip-label">未实现收益</div>
            <div className={`profit-strip-value ${pnlClass(calcProjectUnrealizedProfit(projectDetail))}`}>{`${calcProjectUnrealizedProfit(projectDetail) > 0 ? '+' : ''}${money(calcProjectUnrealizedProfit(projectDetail))}`}</div>
          </div>
          <div className="profit-strip-card emphasis">
            <div className="profit-strip-label">总收益</div>
            <div className={`profit-strip-value ${pnlClass(calcProjectProfit(projectDetail))}`}>{`${calcProjectProfit(projectDetail) > 0 ? '+' : ''}${money(calcProjectProfit(projectDetail))}`}</div>
          </div>
        </div>
        <Descriptions column={mobile ? 1 : 2} size={mobile ? 'small' : 'default'}>
          <Descriptions.Item label="已实现收益">{renderPnl(calcProjectRealizedProfit(projectDetail))}</Descriptions.Item>
          <Descriptions.Item label="未实现收益">{renderPnl(calcProjectUnrealizedProfit(projectDetail))}</Descriptions.Item>
          <Descriptions.Item label="总收益">{renderPnl(calcProjectProfit(projectDetail))}</Descriptions.Item>
          <Descriptions.Item label="净收益(变现+市值-投入)">{renderPnl(calcProjectNetProfit(projectDetail))}</Descriptions.Item>
          <Descriptions.Item label="收益率">{renderPnl(calcProjectProfitRate(projectDetail) * 100, '%')}</Descriptions.Item>
          <Descriptions.Item label="最大敞口">{money(projectDetail.max_exposure)}</Descriptions.Item>
          <Descriptions.Item label="最大损失">{money(projectDetail.max_loss)}</Descriptions.Item>
        </Descriptions>
      </div>
    </Space>
  );
}
