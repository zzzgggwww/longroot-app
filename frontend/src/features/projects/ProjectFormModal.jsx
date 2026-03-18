/**
 * 模块说明：项目表单弹窗：负责项目的新建/编辑表单输入、校验和提交。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Form, Input, InputNumber, Modal, Radio, Select } from 'antd';
import { defaultProjectForm } from '../../lib/constants';

const periodOptions = [
  { label: 'H', value: 'H' },
  { label: 'D', value: 'D' },
  { label: 'W', value: 'W' }
];

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 }
];

export default function ProjectFormModal({
  title,
  open,
  onOpenChange,
  initialValues,
  onFinish
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const mergedInitialValues = useMemo(() => ({
    ...defaultProjectForm(),
    ...initialValues
  }), [initialValues]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    form.setFieldsValue(mergedInitialValues);
  }, [form, open, mergedInitialValues]);

  async function handleOk() {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const ok = await onFinish(values);
      if (ok !== false) {
        onOpenChange(false);
        form.resetFields();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      width={560}
      okText="保存"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" initialValues={mergedInitialValues}>
        <Form.Item
          name="symbol"
          label="交易对"
          rules={[
            { required: true, message: '请输入交易对' },
            { whitespace: true, message: '交易对不能为空' }
          ]}
        >
          <Input placeholder="BTCUSDT" autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="period"
          label="周期"
          rules={[{ required: true, message: '请选择周期' }]}
        >
          <Select options={periodOptions} />
        </Form.Item>

        <Form.Item name="buyAmountPerOrder" label="每次买入金额" rules={[{ required: true, message: '请输入每次买入金额' }]}>
          <InputNumber min={0} precision={2} style={{ width: '100%' }} addonBefore="$" />
        </Form.Item>

        <Form.Item name="takeProfitMultiple" label="限红倍数" rules={[{ required: true, message: '请输入限红倍数' }]}>
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="sellDivisor" label="卖出除数" rules={[{ required: true, message: '请输入卖出除数' }]}>
          <InputNumber min={1} precision={2} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Radio.Group options={statusOptions} optionType="button" buttonStyle="solid" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
