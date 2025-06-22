<script lang="ts" setup>
import type { EquipmentApi } from '../../api/modules/equipment';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';

import { 
  Button, 
  Card, 
  Form, 
  message, 
  Input, 
  Select,
  DatePicker, 
  InputNumber,
  Input as AntdInput
} from 'ant-design-vue';

import {
  createEquipmentApi,
  getEquipmentDetailApi,
  updateEquipmentApi,
} from '../../api/modules/equipment';

defineOptions({ name: 'EquipmentEdit' });

const router = useRouter();
const route = useRoute();
const equipmentId = Number(route.query.id);
const isEdit = !!equipmentId;

const formRef = ref();
const loading = ref(false);
const equipmentInfo = ref<EquipmentApi.EquipmentInfo | null>(null);

interface ExtendedEquipmentParams extends EquipmentApi.CreateEquipmentParams {
  maintenance_cycle?: number;
  next_maintenance?: string | dayjs.Dayjs | undefined;
  purchase_date?: string | dayjs.Dayjs | undefined;
  serial_number?: string;
}

const formData = ref<ExtendedEquipmentParams>({
  name: '',
  type: '',
  status: 1,
  purchaseDate: '',
  purchase_date: '',
  price: 0,
  model: '',
  serial_number: '',
  location: '',
  remark: '',
  maintenance_cycle: 30,
  next_maintenance: '',
});

const statusOptions = [
  { label: '正常', value: 1 },
  { label: '维修中', value: 2 },
  { label: '报废', value: 3 },
];

async function getEquipmentDetail() {
  try {
    loading.value = true;
    const res = await getEquipmentDetailApi(equipmentId);
    equipmentInfo.value = res;

    if (res) {
      formData.value = {
        name: res.name || '',
        type: res.type || '',
        model: res.model || '',
        purchaseDate: res.purchaseDate || '',
        purchase_date: res.purchaseDate ? dayjs(res.purchaseDate) : undefined,
        status: res.status || 1,
        price: res.price || 0,
        location: res.location || '',
        remark: res.remark || '',
        maintenance_cycle: 30,
        next_maintenance: '',
      };
    }
  } catch (error) {
    console.error('获取设备详情失败', error);
    message.error('获取设备详情失败');
  } finally {
    loading.value = false;
  }
}

// 提交表单
async function handleSubmit() {
  try {
    loading.value = true;

    const apiParams: EquipmentApi.CreateEquipmentParams = {
      name: formData.value.name,
      type: formData.value.type,
      status: formData.value.status,
      purchaseDate: typeof formData.value.purchase_date === 'object' && formData.value.purchase_date !== null
        ? formData.value.purchase_date.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') 
        : formData.value.purchase_date 
          ? dayjs(formData.value.purchase_date as string).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
          : '',
      price: formData.value.price,
      model: formData.value.model,
      location: formData.value.location,
      remark: formData.value.remark,
    };

    if (isEdit) {
      await updateEquipmentApi(equipmentId, apiParams);
      message.success('更新设备成功');
    } else {
      await createEquipmentApi(apiParams);
      message.success('创建设备成功');
    }

    // 返回列表页
    router.push('/equipment');
  } catch (error) {
    console.error('操作失败', error);
    message.error(isEdit ? '更新设备失败' : '创建设备失败');
  } finally {
    loading.value = false;
  }
}

// 取消操作
function handleCancel() {
  router.push('/equipment');
}

onMounted(() => {
  if (isEdit) {
    getEquipmentDetail();
  }
});
</script>

<template>
  <div class="equipment-edit">
    <Card :bordered="false" :title="isEdit ? '编辑设备' : '添加设备'">
      <Form
        ref="formRef"
        :model="formData"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
      >
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
          label="购买日期"
          name="purchase_date"
          :rules="[{ required: true, message: '请选择购买日期' }]"
        >
          <DatePicker
            v-model:value="formData.purchase_date"
            style="width: 100%"
            format="YYYY-MM-DD"
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
          label="设备状态"
          name="status"
          :rules="[{ required: true, message: '请选择设备状态' }]"
        >
          <Select
            v-model:value="formData.status"
            placeholder="请选择设备状态"
          >
            <Select.Option
              v-for="item in statusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="维护周期(天)" name="maintenance_cycle">
          <InputNumber
            v-model:value="formData.maintenance_cycle"
            :min="1"
            style="width: 100%"
          />
        </Form.Item>

        <Form.Item label="下次维护时间" name="next_maintenance">
          <DatePicker
            v-model:value="formData.next_maintenance"
            style="width: 100%"
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item label="备注信息" name="remark">
          <AntdInput.TextArea
            v-model:value="formData.remark"
            :rows="4"
            placeholder="请输入备注信息"
          />
        </Form.Item>

        <Form.Item :wrapper-col="{ offset: 4, span: 16 }">
          <Button type="primary" :loading="loading" @click="handleSubmit">
            提交
          </Button>
          <Button style="margin-left: 8px" @click="handleCancel">取消</Button>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>

<style lang="less" scoped>
.equipment-edit {
  :deep(.ant-card-body) {
    padding: 24px;
  }
}
</style>
