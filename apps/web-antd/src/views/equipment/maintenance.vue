<script lang="ts" setup>

import type { EquipmentApi } from '../../api/modules/equipment';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  addMaintenanceRecordApi,
  getEquipmentDetailApi,
  getMaintenanceRecordsApi,
} from '../../api/modules/equipment';


defineOptions({ name: 'EquipmentMaintenance' });

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const equipmentId = ref<null | number>(null);
const equipmentInfo = ref<EquipmentApi.EquipmentInfo | null>(null);
const showAddForm = ref(false);

const dataSource = ref<any[]>([]);
const loadingRef = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const columns = [
  {
    title: '记录ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '维护类型',
    dataIndex: 'maintenance_type',
    width: 120,
  },
  {
    title: '维护日期',
    dataIndex: 'maintenance_date',
    width: 120,
  },
  {
    title: '费用',
    dataIndex: 'cost',
    width: 100,
    customRender: ({ text }: { text: number }) => `${text} 元`,
  },
  {
    title: '维护描述',
    dataIndex: 'description',
    width: 300,
  },
  {
    title: '记录时间',
    dataIndex: 'created_at',
    width: 150,
  },
];

const tableProps = reactive({
  columns,
  dataSource: dataSource.value,
  rowKey: 'id',
  pagination,
  loading: loadingRef,
});

function handleTableChange(paginationObj: any) {
  pagination.current = paginationObj.current;
  pagination.pageSize = paginationObj.pageSize;
  if (equipmentId.value) {
    loadMaintenanceRecords(equipmentId.value);
  }
}

const formData = reactive<EquipmentApi.MaintenanceRecordParams>({
  equipment_id: 0,
  maintenance_type: '',
  maintenance_date: '',
  cost: 0,
  description: '',
});

const maintenanceTypeOptions = [
  { value: '定期维护', label: '定期维护' },
  { value: '故障维修', label: '故障维修' },
  { value: '设备保养', label: '设备保养' },
  { value: '其他', label: '其他' },
];

function resetForm() {
  formData.maintenance_type = '';
  formData.maintenance_date = '';
  formData.cost = 0;
  formData.description = '';
}

async function loadEquipmentInfo(id: number) {
  loading.value = true;
  try {
    const res = await getEquipmentDetailApi(id);
    equipmentInfo.value = res;
    loadMaintenanceRecords(id);
  } catch (error) {
    console.error('获取设备信息失败：', error);
    message.error('获取设备信息失败');
    router.push('/equipment');
  } finally {
    loading.value = false;
  }
}

async function loadMaintenanceRecords(id: number) {
  loadingRef.value = true;
  try {
    const res = await getMaintenanceRecordsApi(id);

    dataSource.value = res || [];
    pagination.total = res?.length || 0;
    tableProps.dataSource = dataSource.value;
  } catch (error) {
    console.error('获取维护记录失败：', error);
    message.error('获取维护记录失败');
  } finally {
    loadingRef.value = false;
  }
}

function showAddMaintenanceForm() {
  if (!equipmentId.value) {
    message.error('未选择设备');
    return;
  }

  formData.equipment_id = equipmentId.value;
  showAddForm.value = true;
}

const formRef = ref();

async function handleAddMaintenance() {
  try {
    await formRef.value.validateFields();

    const apiParams = {
      equipment_id: formData.equipment_id,
      maintenance_type: formData.maintenance_type,
      maintenance_date: typeof formData.maintenance_date === 'object' && formData.maintenance_date !== null
        ? dayjs(formData.maintenance_date).format('YYYY-MM-DD')
        : formData.maintenance_date,
      cost: formData.cost,
      description: formData.description,
    };

    loading.value = true;
    
    try {
      const res = await addMaintenanceRecordApi(apiParams);

      showAddForm.value = false;
      
      resetForm();
      
      if (res && res.id) {
        message.success('添加维护记录成功');
      } else if (res && res.code !== undefined) {
        if (res.code === 0) {
          message.success('添加维护记录成功');
        } else {
          message.warning(`操作提示：${res.message || '未知状态'}`);
        }
      } else {
        message.warning('操作完成，但返回状态未知');
      }
      
      if (equipmentId.value) {
        loadMaintenanceRecords(equipmentId.value);
      }
    } catch (apiError) {
      console.error('API调用出错:', apiError);
      message.error('网络错误，但数据可能已添加，请刷新页面查看');
    } finally {
      loading.value = false;
    }
  } catch (validationError) {
    console.error('表单验证失败:', validationError);
    message.error('表单数据有误，请检查');
  }
}

function handleBack() {
  router.push('/equipment');
}

onMounted(() => {
  const id = route.query?.id;
  if (id) {
    equipmentId.value = Number(id);
    loadEquipmentInfo(equipmentId.value);
  } else {
    message.error('未指定设备ID');
    router.push('/equipment');
  }
});
</script>

<template>
  <div>
    <Card>
      <template #title>设备维护管理</template>
      <template #extra>
        <Space>
          <Button @click="handleBack">返回列表</Button>
          <Button type="primary" @click="showAddMaintenanceForm">
            添加维护记录
          </Button>
        </Space>
      </template>

      <!-- 设备信息 -->
      <Descriptions title="设备信息" :column="3" bordered v-if="equipmentInfo">
        <Descriptions.Item label="设备ID" :span="1">
          {{ equipmentInfo.id }}
        </Descriptions.Item>
        <Descriptions.Item label="设备名称" :span="1">
          {{ equipmentInfo.name }}
        </Descriptions.Item>
        <Descriptions.Item label="设备类型" :span="1">
          {{ equipmentInfo.type }}
        </Descriptions.Item>
        <Descriptions.Item label="状态" :span="1">
          {{ equipmentInfo.status }}
        </Descriptions.Item>
        <Descriptions.Item label="购买日期" :span="1">
          {{ equipmentInfo.purchaseDate }}
        </Descriptions.Item>
        <Descriptions.Item label="价格" :span="1">
          {{ equipmentInfo.price }} 元
        </Descriptions.Item>
      </Descriptions>

      <!-- 维护记录表格 -->
      <div style="margin-top: 20px">
        <div
          class="table-title"
          style="margin-bottom: 8px; font-size: 16px; font-weight: bold"
        >
          维护记录
        </div>
        <Table
          v-bind="tableProps"
          :loading="loadingRef"
          @change="handleTableChange"
        />
      </div>

      <!-- 添加维护记录表单 -->
      <Modal
        v-model:open="showAddForm"
        title="添加维护记录"
        @ok="handleAddMaintenance"
        :confirm-loading="loading"
      >
        <Form ref="formRef" layout="vertical" :model="formData">
          <Form.Item
            label="维护类型"
            name="maintenance_type"
            :rules="[{ required: true, message: '请选择维护类型' }]"
          >
            <Select
              v-model:value="formData.maintenance_type"
              placeholder="请选择维护类型"
              style="width: 100%"
              :options="maintenanceTypeOptions"
            />
          </Form.Item>

          <Form.Item
            label="维护日期"
            name="maintenance_date"
            :rules="[{ required: true, message: '请选择维护日期' }]"
          >
            <DatePicker
              v-model:value="formData.maintenance_date"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            label="维护费用"
            name="cost"
            :rules="[{ required: true, message: '请输入维护费用' }]"
          >
            <InputNumber
              v-model:value="formData.cost"
              style="width: 100%"
              :min="0"
              :precision="2"
              addon-after="元"
            />
          </Form.Item>

          <Form.Item
            label="维护描述"
            name="description"
            :rules="[{ required: true, message: '请输入维护描述' }]"
          >
            <Input.TextArea
              v-model:value="formData.description"
              placeholder="请输入维护描述"
              :rows="4"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  </div>
</template>
