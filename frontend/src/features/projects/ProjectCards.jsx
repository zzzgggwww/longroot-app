/**
 * 模块说明：移动端项目卡片列表：在小屏幕下替代表格展示项目信息和操作按钮。
 */
import React from 'react';
import { Button, Card, List, Space, Typography } from 'antd';
import { money, signalTag, statusTag } from '../../lib/formatters';
import { PauseGlyph, PlayGlyph } from '../../lib/icons';
import { calcProjectProfit, calcProjectProfitRate } from '../../hooks/useProjectMetrics';

const { Text } = Typography;

export default function ProjectCards({ projects, selectedProjectId, onSelect, onEdit, onSync, onToggleStatus, onDelete, loading }) {
  return (
    <List
      dataSource={projects}
      locale={{ emptyText: '暂无项目' }}
      renderItem={(item) => {
        const enabled = Number(item.status) === 1;
        const profit = calcProjectProfit(item);
        const profitRate = calcProjectProfitRate(item) * 100;
        return (
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
                <div className="row-split">
                  <Text>总收益</Text>
                  <Text strong style={{ color: profit > 0 ? '#16a34a' : profit < 0 ? '#dc2626' : undefined }}>
                    {`${profit > 0 ? '+' : ''}${money(profit)}`}
                  </Text>
                </div>
                <div className="row-split">
                  <Text>盈亏率</Text>
                  <Text strong style={{ color: profitRate > 0 ? '#16a34a' : profitRate < 0 ? '#dc2626' : undefined }}>
                    {`${profitRate > 0 ? '+' : ''}${profitRate.toFixed(2)}%`}
                  </Text>
                </div>
                <Space wrap>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>编辑</Button>
                  <Button size="small" disabled={!enabled} onClick={(e) => { e.stopPropagation(); onSync(item.id); }}>同步</Button>
                  <Button
                    size="small"
                    icon={enabled ? <PauseGlyph /> : <PlayGlyph />}
                    loading={loading}
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(item); }}
                  >
                    {enabled ? '停用' : '启用'}
                  </Button>
                  <Button size="small" danger onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>删除</Button>
                </Space>
              </Space>
            </Card>
          </List.Item>
        );
      }}
    />
  );
}
