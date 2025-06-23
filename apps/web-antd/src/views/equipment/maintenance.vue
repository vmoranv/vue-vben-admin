<script lang="ts" setup>
import type { EquipmentApi } from '../../api/modules/equipment';

import { h, onMounted, reactive, ref } from 'vue';
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
  Popconfirm,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  addMaintenanceRecordApi,
  deleteMaintenanceRecordApi,
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
    customRender: ({ text }: { text: number }) => `${text || 0} 元`,
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
  {
    title: '操作',
    dataIndex: 'action',
    width: 100,
    customRender: ({ record }: { record: any }) => [
      h(
        Popconfirm,
        {
          title: '确定要删除这条维护记录吗？',
          content: '删除后无法恢复',
          onConfirm: () => handleDeleteRecord(record.id),
          okText: '确定',
          cancelText: '取消',
        },
        {
          default: () =>
            h(
              Button,
              {
                type: 'link',
                danger: true,
                size: 'small',
              },
              { default: () => '删除' },
            ),
        },
      ),
    ],
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

// 删除维护记录
async function handleDeleteRecord(recordId: number) {
  try {
    await deleteMaintenanceRecordApi(recordId);
    message.success('删除维护记录成功');

    if (equipmentId.value) {
      await loadMaintenanceRecords(equipmentId.value);
    }
  } catch (error: any) {
    console.error('删除维护记录失败：', error);
    message.error(error.response?.data?.message || '删除维护记录失败');
  }
}

async function loadEquipmentInfo(id: number) {
  loading.value = true;
  try {
    const res = (await getEquipmentDetailApi(id)) as unknown as any;
    if (res && typeof res === 'object') {
      if ('code' in res && 'data' in res) {
        if (res.code === 0 && res.data) {
          equipmentInfo.value = res.data;
        } else {
          message.error(res.message || '获取设备信息失败');
        }
      } else if ('id' in res && 'name' in res) {
        equipmentInfo.value = res;
      } else {
        message.error('获取设备信息失败：数据格式错误');
      }
    } else {
      message.error('获取设备信息失败：响应数据无效');
    }
  } catch (error: any) {
    console.error('获取设备信息失败：', error);
    message.error('获取设备信息失败');
  } finally {
    loading.value = false;
  }
}

async function loadMaintenanceRecords(id: number) {
  loadingRef.value = true;
  try {
    const res = (await getMaintenanceRecordsApi(id)) as unknown as any;
    if (res && typeof res === 'object') {
      if ('code' in res && 'data' in res) {
        if (res.code === 0) {
          dataSource.value = res.data || [];
          tableProps.dataSource = dataSource.value;
        } else {
          message.error(res.message || '获取维护记录失败');
        }
      } else if (Array.isArray(res)) {
        dataSource.value = res;
        tableProps.dataSource = dataSource.value;
      } else {
        message.error('获取维护记录失败：数据格式错误');
      }
    } else {
      message.error('获取维护记录失败：响应数据无效');
    }
  } catch (error: any) {
    console.error('获取维护记录失败：', error);
    message.error('获取维护记录失败');
  } finally {
    loadingRef.value = false;
  }
}

async function handleSubmit() {
  try {
    if (
      !formData.maintenance_type ||
      !formData.maintenance_date ||
      !formData.description
    ) {
      message.warning('请填写完整的维护信息');
      return;
    }

    const params = {
      ...formData,
      equipment_id: equipmentId.value!,
      maintenance_date: formData.maintenance_date,
      cost: Number(formData.cost) || 0,
    };

    await addMaintenanceRecordApi(params);
    message.success('添加维护记录成功');

    showAddForm.value = false;
    resetForm();

    await loadMaintenanceRecords(equipmentId.value!);

    await loadEquipmentInfo(equipmentId.value!);
  } catch (error: any) {
    console.error('添加维护记录失败：', error);
    message.error(error.response?.data?.message || '添加维护记录失败');
  }
}

function handleCancel() {
  showAddForm.value = false;
  resetForm();
}

function handleAdd() {
  showAddForm.value = true;
}

function goBack() {
  router.push('/equipment');
}

onMounted(() => {
  const id = route.query.id;
  if (id) {
    equipmentId.value = Number(id);
    loadEquipmentInfo(equipmentId.value);
    loadMaintenanceRecords(equipmentId.value);
  } else {
    message.error('未提供设备ID');
    router.push('/equipment');
  }
});
</script>

<template>
  <div class="p-4">
    <!-- 设备信息卡片 -->
    <Card class="mb-4" title="设备信息" :loading="loading">
      <Descriptions v-if="equipmentInfo" :column="3" bordered>
        <Descriptions.Item label="设备名称">
          {{ equipmentInfo.name }}
        </Descriptions.Item>
        <Descriptions.Item label="设备类型">
          {{ equipmentInfo.type }}
        </Descriptions.Item>
        <Descriptions.Item label="设备状态">
          <span
            :class="{
              'text-green-600': equipmentInfo.status === 1,
              'text-orange-600': equipmentInfo.status === 2,
              'text-red-600': equipmentInfo.status === 3,
            }"
          >
            {{
              equipmentInfo.status === 1
                ? '正常'
                : equipmentInfo.status === 2
                  ? '维修中'
                  : '报废'
            }}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="设备型号">
          {{ equipmentInfo.model || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="位置">
          {{ equipmentInfo.location || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="购买价格">
          {{ equipmentInfo.price ? `${equipmentInfo.price} 元` : '-' }}
        </Descriptions.Item>
      </Descriptions>
    </Card>

    <!-- 维护记录卡片 -->
    <Card title="维护记录">
      <template #extra>
        <Space>
          <Button type="primary" @click="handleAdd">添加维护记录</Button>
          <Button @click="goBack">返回设备列表</Button>
        </Space>
      </template>

      <Table v-bind="tableProps" @change="handleTableChange" />
    </Card>

    <!-- 添加维护记录模态框 -->
    <Modal
      v-model:open="showAddForm"
      title="添加维护记录"
      width="600px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item label="维护类型" required>
          <Select
            v-model:value="formData.maintenance_type"
            placeholder="请选择维护类型"
            :options="maintenanceTypeOptions"
          />
        </Form.Item>

        <Form.Item label="维护日期" required>
          <DatePicker
            v-model:value="formData.maintenance_date"
            style="width: 100%"
            placeholder="请选择维护日期"
            :disabled-date="
              (current) => current && current > dayjs().endOf('day')
            "
          />
        </Form.Item>

        <Form.Item label="维护费用">
          <InputNumber
            v-model:value="formData.cost"
            style="width: 100%"
            placeholder="请输入维护费用"
            :min="0"
            :precision="2"
          />
        </Form.Item>

        <Form.Item label="维护描述" required>
          <Input.TextArea
            v-model:value="formData.description"
            placeholder="请输入维护描述"
            :rows="4"
            :maxlength="500"
            show-count
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
