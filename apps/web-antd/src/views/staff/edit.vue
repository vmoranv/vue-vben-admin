<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { StaffApi } from '../../api/modules/staff';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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

import { getStaffDetailApi, updateStaffApi } from '../../api/modules/staff';

defineOptions({ name: 'StaffEdit' });

const router = useRouter();
const route = useRoute();
const formRef = ref();
const loading = ref(false);
const staffId = ref<null | number>(null);
const imageUrl = ref<string>('');
const fileList = ref<any[]>([]);

const formData = ref<StaffApi.UpdateStaffParams>({
  id: 0,
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
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

function beforeUpload(file: File) {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片必须小于 2MB!');
  }
  return isJpgOrPng && isLt2M;
}

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

async function fetchStaffDetail() {
  try {
    loading.value = true;
    if (staffId.value) {
      const response = await getStaffDetailApi(staffId.value);

      if (response) {
        const staffInfo = response;

        formData.value = {
          id: staffInfo.id || staffId.value,
          name: staffInfo.name || '',
          username: staffInfo.username || '',
          password: '',
          role: staffInfo.role || '',
          phone: staffInfo.phone || '',
          email: staffInfo.email || '',
          status: staffInfo.status || 'active',
          avatar: staffInfo.avatar || '',
        };

        if (staffInfo.avatar) {
          imageUrl.value = staffInfo.avatar;
          fileList.value = [
            {
              uid: '-1',
              name: 'avatar.png',
              status: 'done',
              url: staffInfo.avatar,
            },
          ];
        }
      } else {
        throw new Error('获取数据失败');
      }
    }
  } catch (error: any) {
    console.error('获取人员信息失败:', error);

    if (error.response?.status === 404) {
      message.error('员工不存在，将返回员工列表');
      router.push('/staff/list');
    } else if (error.response?.data?.code === 404) {
      message.error('员工不存在或已被删除');
      router.push('/staff/list');
    } else {
      const errorMessage =
        error.response?.data?.message || error.message || '获取人员信息失败';
      message.error(errorMessage);
      console.error('详细错误信息:', error.response?.data);
    }
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
    loading.value = true;

    const updateData = { ...formData.value };

    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }

    const response = await updateStaffApi(updateData);

    if (response && (response.code === 0 || response.code === undefined)) {
      message.success('更新成功');
      router.push('/staff/list');
    } else {
      throw new Error(response?.message || '更新失败');
    }
  } catch (error: any) {
    console.error('更新失败详情:', error);

    let errorMessage = '更新失败';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  router.push('/staff/list');
}

onMounted(() => {
  const id = route.params.id;
  if (id) {
    staffId.value = Number(id);
    fetchStaffDetail();
  }
});
</script>

<template>
  <div>
    <Card title="编辑内部人员">
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
            placeholder="留空表示不修改密码"
          />
        </Form.Item>

        <Form.Item label="角色" name="role">
          <Select v-model:value="formData.role" placeholder="请选择角色">
            <Select.Option value="admin">超级管理员</Select.Option>
            <Select.Option value="manager">管理员</Select.Option>
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
