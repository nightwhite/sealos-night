import { createResource } from '@/api/create';
import { getTemplate } from '@/api/template';
import { Resources } from '@/constants/kube-object';
import { Editor } from '@monaco-editor/react';
import { editor as EditorNS } from 'monaco-editor';
import { Button, Cascader, Modal, Spin, message } from 'antd';
import { BaseOptionType } from 'antd/lib/cascader';

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  setClose: () => void;
}

interface Option extends BaseOptionType {
  value: string;
  label: string;
  children?: Option[];
}

const options: Option[] = [
  {
    value: 'workload',
    label: 'Workload',
    children: [
      {
        value: Resources.Pods,
        label: 'Pod'
      },
      {
        value: Resources.Deployments,
        label: 'Deployment'
      },
      {
        value: Resources.StatefulSets,
        label: 'Stateful Set'
      }
    ]
  },
  {
    value: 'network',
    label: 'Network',
    children: [
      {
        value: Resources.Ingresses,
        label: 'Ingress'
      }
    ]
  },
  {
    value: 'config',
    label: 'Config',
    children: [
      {
        value: Resources.ConfigMaps,
        label: 'Config Map'
      },
      {
        value: Resources.Secrets,
        label: 'Secret'
      }
    ]
  },
  {
    value: 'storage',
    label: 'Storage',
    children: [
      {
        value: Resources.PersistentVolumeClaims,
        label: 'Persistent Volume Claim'
      }
    ]
  }
];

const defaultTemplate = 'Please select a template first.';

const CreateResourceModal = ({ open, setClose }: Props) => {
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [optionValue, setOptionValue] = useState<Resources>();
  const [template, setTemplate] = useState<string>(defaultTemplate);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();

  const editorRef = useRef<EditorNS.IStandaloneCodeEditor | null>(null);
  const onEditorMount = (editor: EditorNS.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  const onChange = (value: (string | number)[]) => {
    if (!value || value.length === 0) {
      setDisabled(true);
      setTemplate(defaultTemplate);
      return;
    }
    setDisabled(false);
    setOptionValue(value[value.length - 1] as Resources);
    setLoading(true);
  };

  useEffect(() => {
    if (!optionValue) return;
    const fetchTemplate = async () => {
      const storage = localStorage.getItem(`template-${optionValue}`);
      if (!storage) {
        try {
          const data = await getTemplate(optionValue);
          localStorage.setItem(`template-${optionValue}`, data);
          setTemplate(data);
        } catch (err) {
          // TODO: handle error and give a retry button
          msgApi.error('Failed to fetch template');
          console.error(err);
        }
      } else {
        setTemplate(storage);
      }
      setLoading(false);
    };

    fetchTemplate();
  }, [msgApi, optionValue]);

  useEffect(() => {
    if (!confirmLoading || !optionValue) return;
    const postRequest = async () => {
      if (!editorRef.current) return;
      try {
        const response = await createResource(editorRef.current.getValue(), optionValue);
        if (response.code !== 201) {
          msgApi.error(`Failed to create resource: ${response.data.message}`);
        } else {
          msgApi.success('Successfully created resource');
        }
      } catch (err) {
        msgApi.error(`Failed to create resource: ${err}`);
        console.error(err);
      }

      setConfirmLoading(false);
    };

    postRequest();
  }, [confirmLoading, msgApi, optionValue]);

  const onCreate = () => {
    setConfirmLoading(true);
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        title={'Create Resource'}
        onCancel={setClose}
        onOk={setClose}
        footer={[
          <Button
            key="create"
            type="link"
            loading={confirmLoading}
            onClick={onCreate}
            disabled={disabled}
          >
            Create
          </Button>,
          <Button key="cancel" danger type="primary" onClick={setClose}>
            Cancel
          </Button>
        ]}
      >
        <div className="pb-3">
          <div>choose a template</div>
          <Cascader onChange={onChange} placeholder="Please select" options={options} />
        </div>
        <Spin spinning={loading}>
          <div>
            <Editor
              onMount={onEditorMount}
              height={'50vh'}
              language="yaml"
              value={template}
              options={{ readOnly: disabled }}
            />
          </div>
        </Spin>
      </Modal>
    </>
  );
};

export default CreateResourceModal;