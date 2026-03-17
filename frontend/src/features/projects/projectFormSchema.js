export function projectFormColumns() {
  return [
    {
      title: '交易对',
      dataIndex: 'symbol',
      valueType: 'text',
      formItemProps: { rules: [{ required: true, message: '请输入交易对' }] },
      fieldProps: { placeholder: 'BTCUSDT' }
    },
    {
      title: '周期',
      dataIndex: 'period',
      valueType: 'select',
      valueEnum: {
        H: { text: 'H' },
        D: { text: 'D' },
        W: { text: 'W' }
      },
      formItemProps: { rules: [{ required: true, message: '请选择周期' }] }
    },
    {
      title: '每次买入金额',
      dataIndex: 'buyAmountPerOrder',
      valueType: 'digit',
      fieldProps: { min: 0, precision: 2 }
    },
    {
      title: '限红倍数',
      dataIndex: 'takeProfitMultiple',
      valueType: 'digit',
      fieldProps: { min: 0, precision: 2 }
    },
    {
      title: '卖出除数',
      dataIndex: 'sellDivisor',
      valueType: 'digit',
      fieldProps: { min: 1, precision: 2 }
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'radio',
      valueEnum: {
        1: { text: '启用' },
        0: { text: '停用' }
      }
    }
  ];
}
