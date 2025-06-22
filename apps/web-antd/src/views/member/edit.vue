<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Radio,
  Select,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getMemberDetailApi, updateMemberApi } from '../../api/modules/members';

defineOptions({ name: 'MemberEdit' });

const router = useRouter();
const route = useRoute();
const formRef = ref();
const loading = ref(false);
const memberId = ref<null | number>(null);

const formData = ref({
  name: '',
  gender: 1,
  phone: '',
  birth_date: undefined as dayjs.Dayjs | undefined,
  membership_type: '',
  join_date: undefined as dayjs.Dayjs | undefined,
  expire_date: undefined as dayjs.Dayjs | undefined,
  status: 1,
  remark: '',
});

async function handleSubmit() {
  try {
    const values = await formRef.value.validateFields();
    loading.value = true;

    const submitData = {
      name: values.name,
      gender: Number(values.gender),
      phone: values.phone,
      birth_date: values.birth_date
        ? dayjs(values.birth_date).format('YYYY-MM-DD')
        : undefined,
      membership_type: values.membership_type,
      join_date: values.join_date
        ? dayjs(values.join_date).format('YYYY-MM-DD')
        : undefined,
      expire_date: values.expire_date
        ? dayjs(values.expire_date).format('YYYY-MM-DD')
        : undefined,
      status: Number(values.status),
      remark: values.remark || '',
    };

    if (memberId.value) {
      const response = await updateMemberApi(memberId.value, submitData);

      if (response && response.id) {
        message.success('会员信息更新成功');
        setTimeout(() => {
          router.push('/member/list');
        }, 100);
      } else {
        throw new Error('更新响应异常');
      }
    }
  } catch (error) {
    console.error('更新失败：', error);
    message.error('更新失败');
  } finally {
    loading.value = false;
  }
}

async function loadMemberInfo(id: number) {
  try {
    loading.value = true;
    const response = await getMemberDetailApi(id);

    if (response) {
      formData.value = {
        name: response.name || '',
        gender: Number(response.gender) || 1,
        phone: response.phone || '',
        birth_date: response.birth_date
          ? dayjs(response.birth_date)
          : undefined,
        membership_type: response.membership_type || '',
        join_date: response.join_date ? dayjs(response.join_date) : undefined,
        expire_date: response.expire_date
          ? dayjs(response.expire_date)
          : undefined,
        status: Number(response.status) || 1,
        remark: response.remark || '',
      };
    }
  } catch (error) {
    message.error('加载会员信息失败');
    console.error('加载会员信息失败：', error);
  } finally {
    loading.value = false;
  }
}

function handleBack() {
  router.push('/member/list');
}

const membershipTypes = [
  { label: '月卡', value: '月卡' },
  { label: '季卡', value: '季卡' },
  { label: '年卡', value: '年卡' },
];

onMounted(() => {
  const id = route.params?.id;
  if (id) {
    memberId.value = Number(id);
    loadMemberInfo(memberId.value);
  }
});
</script>

<template>
  <div>
    <Card title="编辑会员" :loading="loading">
      <template #extra>
        <Button @click="handleBack">返回</Button>
      </template>

      <Form
        ref="formRef"
        :model="formData"
        layout="vertical"
        style="max-width: 800px"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            label="姓名"
            name="name"
            :rules="[{ required: true, message: '请输入会员姓名' }]"
          >
            <Input v-model:value="formData.name" placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="性别"
            name="gender"
            :rules="[{ required: true, message: '请选择性别' }]"
          >
            <Radio.Group v-model:value="formData.gender">
              <Radio :value="1">男</Radio>
              <Radio :value="2">女</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            :rules="[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]"
          >
            <Input v-model:value="formData.phone" placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item label="生日" name="birth_date">
            <DatePicker
              v-model:value="formData.birth_date"
              style="width: 100%"
              placeholder="请选择生日"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            label="会员类型"
            name="membership_type"
            :rules="[{ required: true, message: '请选择会员类型' }]"
          >
            <Select
              v-model:value="formData.membership_type"
              placeholder="请选择会员类型"
            >
              <Select.Option
                v-for="type in membershipTypes"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="入会日期"
            name="join_date"
            :rules="[{ required: true, message: '请选择入会日期' }]"
          >
            <DatePicker
              v-model:value="formData.join_date"
              style="width: 100%"
              placeholder="请选择入会日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            label="过期日期"
            name="expire_date"
            :rules="[{ required: true, message: '请选择过期日期' }]"
          >
            <DatePicker
              v-model:value="formData.expire_date"
              style="width: 100%"
              placeholder="请选择过期日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            :rules="[{ required: true, message: '请选择状态' }]"
          >
            <Select v-model:value="formData.status" placeholder="请选择状态">
              <Select.Option :value="1">有效</Select.Option>
              <Select.Option :value="0">过期</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item label="备注" name="remark">
          <Input.TextArea
            v-model:value="formData.remark"
            placeholder="请输入备注信息"
            :rows="4"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" :loading="loading" @click="handleSubmit">
            保存
          </Button>
          <Button style="margin-left: 8px" @click="handleBack"> 取消 </Button>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>
