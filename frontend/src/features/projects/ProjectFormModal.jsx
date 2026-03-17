import React from 'react';
import { BetaSchemaForm } from '@ant-design/pro-components';
import { defaultProjectForm } from '../../lib/constants';
import { projectFormColumns } from './projectFormSchema';

export default function ProjectFormModal({
  title,
  open,
  onOpenChange,
  initialValues,
  onFinish
}) {
  return (
    <BetaSchemaForm
      title={title}
      layoutType="ModalForm"
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnClose: true }}
      initialValues={{
        ...defaultProjectForm(),
        ...initialValues
      }}
      columns={projectFormColumns()}
      onFinish={onFinish}
    />
  );
}
