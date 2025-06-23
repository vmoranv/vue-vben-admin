<script lang="tsx" setup>
import { computed, reactive, ref, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  deleteFinancialRecordApi,
  getFinancialRecordsApi,
} from '../../api/modules/financial';

interface FormSchema {
  field: string;
  label: string;
  component: string;
  required?: boolean;
  defaultValue?: any;
  componentProps?: Record<string, any>;
  colProps?: Record<string, any>;
  rules?: any[];
}

defineOptions({ name: 'FinancialRecordList' });

const router = useRouter();

// 查询表单
const searchForm = reactive({
  record_type: undefined,
  start_date: undefined,
  end_date: undefined,
  description: '',
});

// 重置查询
function resetSearch() {
  searchForm.record_type = undefined;
  searchForm.start_date = undefined;
  searchForm.end_date = undefined;
  searchForm.description = '';
}

// 删除记录
async function handleDelete(id: number) {
  try {
    await deleteFinancialRecordApi(id);
    message.success('删除成功');
    loadData(searchForm);
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
}

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '记录类型',
    dataIndex: 'record_type',
    key: 'record_type',
    width: 120,
    customRender: ({ text }: { text: string }) => {
      const typeMap: Record<string, { color: string; text: string }> = {
        '会员费': { color: 'success', text: '会员费' },
        '私教费': { color: 'processing', text: '私教费' },
        '其他收入': { color: 'warning', text: '其他收入' },
        '支出': { color: 'error', text: '支出' },
      };
      const config = typeMap[text] || { color: 'default', text: text || '未知' };
      return h(Tag, { color: config.color }, { default: () => config.text });
    },
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
    customRender: ({ text }: { text: number }) => {
      return `¥${text?.toFixed(2) || '0.00'}`;
    },
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
    customRender: ({ text }: { text: string }) => {
      return text ? new Date(text).toLocaleString() : '-';
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    customRender: ({ record }: { record: any }) => {
      return h(Space, {}, {
        default: () => [
          h(
            Popconfirm,
            {
              title: '确定要删除这条记录吗？',
              onConfirm: () => handleDelete(record.id),
            },
            {
              default: () => h(
                Button,
                {
                  type: 'link',
                  size: 'small',
                  danger: true,
                },
                { default: () => [h(DeleteOutlined), '删除'] }
              ),
            }
          ),
        ],
      });
    },
  },
];

interface TableBindingOptions {
  title: string;
  columns: any[];
  rowKey: string;
  api: (...args: any[]) => Promise<any>;
  useSearchForm?: boolean;
  formConfig?: {
    labelWidth?: number;
    schemas: FormSchema[];
  };
}

function useTable(options: TableBindingOptions) {
  const loadingRef = ref(false);
  const dataSource = ref([]);
  const pagination = ref({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const tableProps = computed(() => ({
    columns: options.columns,
    rowKey: options.rowKey,
    dataSource: dataSource.value,
    pagination: pagination.value,
  }));

  async function loadData(params = {}) {
    loadingRef.value = true;
    try {
      const res = await options.api({
        page: pagination.value.current,
        pageSize: pagination.value.pageSize,
        ...params,
      });

      if (res && res.data && Array.isArray(res.data.list)) {
        dataSource.value = res.data.list;
        pagination.value.total = res.data.pagination?.total || 0;
      } else if (res && Array.isArray(res.list)) {
        dataSource.value = res.list;
        pagination.value.total = res.pagination?.total || 0;
      } else if (res && Array.isArray(res.items)) {
        dataSource.value = res.items;
        pagination.value.total = res.total || 0;
      } else {
        console.warn('未识别的数据结构:', res);
        dataSource.value = [];
        pagination.value.total = 0;
      }
    } catch (error) {
      console.error('加载表格数据失败：', error);
      dataSource.value = [];
      pagination.value.total = 0;
    } finally {
      loadingRef.value = false;
    }
  }

  function handleTableChange(paginationObj: any) {
    pagination.value.current = paginationObj.current;
    pagination.value.pageSize = paginationObj.pageSize;
    loadData(searchForm);
  }

  function setTableProps(newProps: any) {
    Object.assign(tableProps.value, newProps);
  }

  return {
    loadingRef,
    dataSource,
    pagination,
    tableProps,
    loadData,
    handleTableChange,
    setTableProps,
  };
}

const { loadingRef, tableProps, loadData, handleTableChange } = useTable({
  title: '财务记录',
  columns,
  rowKey: 'id',
  api: getFinancialRecordsApi,
});

function handleSearch() {
  loadData(searchForm);
}

function handleAdd() {
  router.push('/financial/create');
}

function handleViewStats() {
  router.push('/financial/stats');
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="p-4">
    <Card title="查询条件" class="mb-4">
      <Form layout="inline" :model="searchForm">
        <Form.Item label="记录类型" name="record_type">
          <Select
            v-model:value="searchForm.record_type"
            placeholder="请选择记录类型"
            style="width: 150px"
            allowClear
          >
            <Select.Option value="会员费">会员费</Select.Option>
            <Select.Option value="私教费">私教费</Select.Option>
            <Select.Option value="其他收入">其他收入</Select.Option>
            <Select.Option value="支出">支出</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="开始日期" name="start_date">
          <DatePicker
            v-model:value="searchForm.start_date"
            placeholder="请选择开始日期"
            style="width: 150px"
          />
        </Form.Item>
        <Form.Item label="结束日期" name="end_date">
          <DatePicker
            v-model:value="searchForm.end_date"
            placeholder="请选择结束日期"
            style="width: 150px"
          />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input
            v-model:value="searchForm.description"
            placeholder="请输入描述关键词"
            style="width: 200px"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" @click="handleSearch">搜索</Button>
          <Button style="margin-left: 8px" @click="resetSearch">重置</Button>
        </Form.Item>
      </Form>
    </Card>

    <Card title="财务管理" :bordered="false">
      <template #extra>
        <Space>
          <Button type="primary" @click="handleAdd">
            <PlusOutlined />
            新增记录
          </Button>
          <Button @click="handleViewStats"> 查看统计 </Button>
        </Space>
      </template>
      <Table
        ref="tableRef"
        v-bind="tableProps"
        :loading="loadingRef"
        @change="handleTableChange"
      />
    </Card>
  </div>
</template>
