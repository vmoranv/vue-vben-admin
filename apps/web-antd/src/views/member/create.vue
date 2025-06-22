<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Radio,
} from 'ant-design-vue';

import { createMemberApi } from '../../api/modules/members';

defineOptions({ name: 'MemberCreate' });

const router = useRouter();
const formRef = ref();
const loading = ref(false);

const formData = ref({
  name: '',
  gender: 1,
  phone: '',
  email: '',
  address: '',
  birth_date: '',
  membership_type: '',
  join_date: '',
  expire_date: '',
  remark: '',
});

async function handleSubmit() {
  try {
    const values = await formRef.value.validateFields();
    loading.value = true;

    const submitData = {
      ...values,
      birth_date: values.birth_date
        ? values.birth_date.format('YYYY-MM-DD')
        : null,
      join_date: values.join_date.format('YYYY-MM-DD'),
      expire_date: values.expire_date.format('YYYY-MM-DD'),
      coach_id: null,
      status: 1,
    };

    await createMemberApi(submitData);
    message.success('创建会员成功');
    router.push('/member');
  } catch (error) {
    console.error('创建会员失败', error);
    message.error('创建会员失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  router.push('/member');
}

const membershipTypes = [
  { label: '月卡会员', value: 'monthly' },
  { label: '季卡会员', value: 'quarterly' },
  { label: '年卡会员', value: 'yearly' },
  { label: 'VIP会员', value: 'vip' },
];
</script>

<template>
  <div>
    <Card>
      <template #title>添加会员</template>
      <Form ref="formRef" :model="formData" layout="vertical">
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

        <Form.Item
          label="邮箱"
          name="email"
          :rules="[{ type: 'email', message: '请输入正确的邮箱格式' }]"
        >
          <Input v-model:value="formData.email" placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item label="地址" name="address">
          <Input v-model:value="formData.address" placeholder="请输入地址" />
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
          label="会员类型"
          name="membership_type"
          :rules="[{ required: true, message: '请选择会员类型' }]"
        >
          <Radio.Group
            v-model:value="formData.membership_type"
            :options="membershipTypes"
          />
        </Form.Item>

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
          <Button style="margin-left: 8px" @click="handleCancel">取消</Button>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>
