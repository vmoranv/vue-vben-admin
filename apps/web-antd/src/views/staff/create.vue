<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';

import type { StaffApi } from '../../api/modules/staff';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { PlusOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Select,
  Upload,
} from 'ant-design-vue';

import { createStaffApi } from '../../api/modules/staff';

defineOptions({ name: 'StaffCreate' });

const router = useRouter();
const formRef = ref();
const loading = ref(false);
const imageUrl = ref<string>('');
const fileList = ref<any[]>([]);

const formData = ref<StaffApi.CreateStaffParams>({
  name: '',
  username: '',
  password: '',
  role: '',
  phone: '',
  email: '',
  status: 'active',
  avatar: '',
});

const rules: Record<string, Rule[]> = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('您只能上传JPG/PNG格式的图片!');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过2MB!');
    return false;
  }
  return isJpgOrPng && isLt2M;
};

const handleCustomRequest = (options: any) => {
  const { file, onSuccess } = options;
  setTimeout(() => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener('load', () => {
      imageUrl.value = reader.result as string;
      formData.value.avatar = reader.result as string;
    });
    onSuccess('ok');
  }, 500);
};

async function handleSubmit() {
  try {
    await formRef.value.validate();
    loading.value = true;

    await createStaffApi(formData.value);
    message.success('创建成功');
    router.push('/staff/list');
  } catch (error: any) {
    console.error(error);
    message.error(error.message || '创建失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  router.push('/staff/list');
}
</script>

<template>
  <div>
    <Card title="新增内部人员">
      <Form
        ref="formRef"
        :model="formData"
        :rules="rules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
      >
        <Form.Item label="姓名" name="name">
          <Input v-model:value="formData.name" placeholder="请输入姓名" />
        </Form.Item>

        <Form.Item label="用户名" name="username">
          <Input v-model:value="formData.username" placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item label="密码" name="password">
          <Input.Password
            v-model:value="formData.password"
            placeholder="请输入密码"
          />
        </Form.Item>

        <Form.Item label="角色" name="role">
          <Select v-model:value="formData.role" placeholder="请选择角色">
            <Select.Option value="admin">超级管理员</Select.Option>
            <Select.Option value="coach">教练</Select.Option>
            <Select.Option value="reception">前台</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="手机号" name="phone">
          <Input v-model:value="formData.phone" placeholder="请输入手机号" />
        </Form.Item>

        <Form.Item label="邮箱" name="email">
          <Input v-model:value="formData.email" placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item label="状态" name="status">
          <Select v-model:value="formData.status" placeholder="请选择状态">
            <Select.Option value="active">活跃</Select.Option>
            <Select.Option value="inactive">停用</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="头像" name="avatar">
          <Upload
            v-model:file-list="fileList"
            :custom-request="handleCustomRequest"
            :show-upload-list="false"
            list-type="picture-card"
            class="avatar-uploader"
            :before-upload="beforeUpload"
          >
            <div v-if="imageUrl">
              <img :src="imageUrl" alt="avatar" style="width: 100%" />
            </div>
            <div v-else>
              <PlusOutlined />
              <div class="ant-upload-text">上传</div>
            </div>
          </Upload>
        </Form.Item>

        <Form.Item :wrapper-col="{ offset: 4, span: 16 }">
          <Button type="primary" @click="handleSubmit" :loading="loading">
            提交
          </Button>
          <Button style="margin-left: 10px" @click="handleCancel">取消</Button>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>

<style scoped>
.avatar-uploader > :deep(.ant-upload) {
  width: 128px;
  height: 128px;
}

.ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>
