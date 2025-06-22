<script lang="tsx" setup>

import type { EquipmentApi } from '../../api/modules/equipment';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue';
import { Button, Card, Form, Input, Popconfirm, Select, Space, Table, Tag } from 'ant-design-vue';

import { deleteEquipmentApi, getEquipmentListApi } from '../../api/modules/equipment';

defineOptions({ name: 'EquipmentList' });

const router = useRouter();
const loading = ref(false);

// 查询表单
const searchForm = reactive({
  name: '',
  type: undefined,
  status: undefined,
});

// 表格列定义
const columns = [
  {
    title: '设备ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '设备名称',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: '设备类型',
    dataIndex: 'type',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ text }: { text: number }) => {
      let color = '';
      let statusText = '';

      switch (text) {
        case 3: {
          color = 'error';
          statusText = '报废';
          break;
        }
        case 1: {
          color = 'success';
          statusText = '正常';
          break;
        }
        case 2: {
          color = 'warning';
          statusText = '维修中';
          break;
        }
        default: {
          color = 'default';
          statusText = '未知';
        }
      }

      return <Tag color={color}>{statusText}</Tag>;
    },
  },
  {
    title: '购买日期',
    dataIndex: 'purchaseDate',
    width: 120,
  },
  {
    title: '最后维护日期',
    dataIndex: 'lastMaintenanceDate',
    width: 150,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    customRender: ({ record }: { record: EquipmentApi.EquipmentInfo }) => (
      <Space>
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
        <Button
          type="link"
          size="small"
          icon={<ToolOutlined />}
          onClick={() => handleMaintenance(record)}
        >
          维护
        </Button>
        <Popconfirm
          title="确定要删除这个设备吗？"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
          >
            删除
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];

// 表格数据和分页
const dataSource = ref<EquipmentApi.EquipmentInfo[]>([]);
const loadingRef = ref(false);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 表格属性
const tableProps = computed(() => ({
  columns,
  dataSource: dataSource.value,
  pagination: pagination.value,
  rowKey: 'id',
}));

// 重置查询
function resetSearch() {
  searchForm.name = '';
  searchForm.type = undefined;
  searchForm.status = undefined;
}

// 执行查询
function handleSearch() {
  pagination.value.current = 1;
  loadData();
}

// 加载数据
async function loadData() {
  loadingRef.value = true;
  try {
    const params = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      ...searchForm,
    };
    
    const response = await getEquipmentListApi(params);
    
    if (response && response.list && Array.isArray(response.list)) {
      dataSource.value = response.list;
      pagination.value.total = response.pagination?.total || 0;
    } else if (response && Array.isArray(response)) {
      dataSource.value = response;
      pagination.value.total = response.length;
    } else {
      console.warn('未识别的数据结构:', response);
      dataSource.value = [];
      pagination.value.total = 0;
    }
  } catch (error) {
    console.error('加载设备列表失败：', error);
    dataSource.value = [];
    pagination.value.total = 0;
  } finally {
    loadingRef.value = false;
  }
}

// 处理表格变更
function handleTableChange(paginationObj: any) {
  pagination.value.current = paginationObj.current;
  loadData();
}

// 初始化加载数据
loadData();

// 处理新增
function handleAdd() {
  router.push('/equipment/create');
}

// 处理编辑
function handleEdit(record: EquipmentApi.EquipmentInfo) {
  router.push({
    path: '/equipment/edit',
    query: { id: record.id },
  });
}

// 处理维护
function handleMaintenance(record: EquipmentApi.EquipmentInfo) {
  router.push({
    path: '/equipment/maintenance',
    query: { id: record.id },
  });
}

// 处理删除
async function handleDelete(record: EquipmentApi.EquipmentInfo) {
  loading.value = true;
  try {
    await deleteEquipmentApi(record.id);
    loadData();
  } catch (error) {
    console.error('删除设备失败：', error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <!-- 查询区域 -->
    <Card title="查询条件" class="mb-4">
      <Form layout="inline" :model="searchForm">
        <Form.Item label="设备名称" name="name">
          <Input
            v-model:value="searchForm.name"
            placeholder="请输入设备名称"
            style="width: 200px"
          />
        </Form.Item>
        <Form.Item label="设备类型" name="type">
          <Select
            v-model:value="searchForm.type"
            placeholder="请选择设备类型"
            style="width: 150px"
            allow-clear
          >
            <Select.Option value="有氧设备">有氧设备</Select.Option>
            <Select.Option value="力量设备">力量设备</Select.Option>
            <Select.Option value="自由重量">自由重量</Select.Option>
            <Select.Option value="功能性训练">功能性训练</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="设备状态" name="status">
          <Select
            v-model:value="searchForm.status"
            placeholder="请选择设备状态"
            style="width: 120px"
            allow-clear
          >
            <Select.Option :value="1">正常</Select.Option>
            <Select.Option :value="2">维修中</Select.Option>
            <Select.Option :value="3">报废</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" @click="handleSearch">搜索</Button>
          <Button style="margin-left: 8px" @click="resetSearch">重置</Button>
        </Form.Item>
      </Form>
    </Card>

    <Card>
      <template #title>设备管理</template>
      <template #extra>
        <Button type="primary" @click="handleAdd">
          <PlusOutlined />
          添加设备
        </Button>
      </template>
      <Table
        v-bind="tableProps"
        :loading="loadingRef"
        @change="handleTableChange"
      />
    </Card>
  </div>
</template>
