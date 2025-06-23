<script lang="ts" setup>
import type { EquipmentApi } from '../../api/modules/equipment';

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';

import { Button, Card, Form, Input, message, Select, InputNumber, DatePicker } from 'ant-design-vue';

import { createEquipmentApi } from '../../api/modules/equipment';

defineOptions({ name: 'EquipmentCreate' });

const router = useRouter();
const formRef = ref();
const loading = ref(false);

interface ExtendedEquipmentParams extends Omit<EquipmentApi.CreateEquipmentParams, 'purchaseDate'> {
  purchaseDate?: string | dayjs.Dayjs;
}

const formData = ref<ExtendedEquipmentParams>({
  name: '',
  type: '',
  status: 1,
  purchaseDate: undefined,
  price: 0,
  model: '',
  location: '',
  remark: '',
});

const statusOptions = [
  { label: '正常', value: 1 },
  { label: '维修中', value: 2 },
  { label: '报废', value: 3 },
];

async function handleSubmit() {
  try {
    loading.value = true;
    
    const submitData: EquipmentApi.CreateEquipmentParams = {
      ...formData.value,
      purchaseDate: formData.value.purchaseDate instanceof dayjs 
        ? formData.value.purchaseDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
        : formData.value.purchaseDate 
          ? dayjs(formData.value.purchaseDate).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') 
          : '',
    };
    
    await createEquipmentApi(submitData);
    message.success('创建设备成功');
    router.push('/equipment');
  } catch (error) {
    console.error('创建设备失败', error);
    message.error('创建设备失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  router.push('/equipment');
}
</script>

<template>
  <div>
    <Card>
      <template #title>添加设备</template>
      <Form ref="formRef" :model="formData" layout="vertical">
        <Form.Item
          label="设备名称"
          name="name"
          :rules="[{ required: true, message: '请输入设备名称' }]"
        >
          <Input v-model:value="formData.name" placeholder="请输入设备名称" />
        </Form.Item>
        <Form.Item
          label="设备类型"
          name="type"
          :rules="[{ required: true, message: '请输入设备类型' }]"
        >
          <Input v-model:value="formData.type" placeholder="请输入设备类型" />
        </Form.Item>
        <Form.Item
          label="设备状态"
          name="status"
          :rules="[{ required: true, message: '请选择设备状态' }]"
        >
          <Select
            v-model:value="formData.status"
            placeholder="请选择设备状态"
            :options="statusOptions"
          />
        </Form.Item>
        <Form.Item
          label="设备价格"
          name="price"
          :rules="[{ required: true, message: '请输入设备价格' }]"
        >
          <InputNumber
            v-model:value="formData.price"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
            addon-after="元"
            placeholder="请输入设备价格"
          />
        </Form.Item>
        <Form.Item
          label="购买日期"
          name="purchaseDate"
          :rules="[{ required: true, message: '请选择购买日期' }]"
        >
          <DatePicker
            v-model:value="formData.purchaseDate"
            style="width: 100%"
            format="YYYY-MM-DD"
          />
        </Form.Item>
        <!-- 其他表单项 -->
        <Button type="primary" :loading="loading" @click="handleSubmit">
          保存
        </Button>
        <Button style="margin-left: 8px" @click="handleCancel">取消</Button>
      </Form>
    </Card>
  </div>
</template>
