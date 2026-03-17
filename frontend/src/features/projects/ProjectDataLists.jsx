import React from 'react';
import { List, Space, Typography } from 'antd';
import { formatTime, money, signalTag } from '../../lib/formatters';

const { Text } = Typography;

export function SignalList({ data }) {
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

export function IndicatorList({ data }) {
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
