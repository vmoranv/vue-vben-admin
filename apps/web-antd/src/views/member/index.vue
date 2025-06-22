<script lang="ts" setup>
import type { MemberApi } from '../../api/modules/members';

import { h, onActivated, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import { Button, Card, Popconfirm, Space, Table, Tag } from 'ant-design-vue';

import { deleteMemberApi, getMemberListApi } from '../../api/modules/members';

defineOptions({ name: 'MemberList' });

onActivated(() => {
  reload();
});

function useTable(options: {
  api: Function;
  columns: any[];
  formConfig?: {
    schemas: any[];
  };
  pagination?: any;
  useSearchForm?: boolean;
}) {
  const tableData = ref([]);
  const loading = ref(false);
  const pagination = ref({
    current: 1,
    pageSize: options.pagination?.pageSize || 10,
    total: 0,
  });

  const searchInfo = ref({});

  const loadData = async () => {
    try {
      loading.value = true;
      const params = {
        page: pagination.value.current,
        pageSize: pagination.value.pageSize,
        _t: Date.now(),
        ...searchInfo.value,
      };

      const response = await options.api(params);

      if (response && response.data && Array.isArray(response.data.list)) {
        tableData.value = response.data.list;
        pagination.value.total = response.data.pagination?.total || 0;
      } else if (response && Array.isArray(response.list)) {
        tableData.value = response.list;
        pagination.value.total = response.pagination?.total || 0;
      } else {
        console.warn('未识别的数据结构:', response);
        tableData.value = [];
        pagination.value.total = 0;
      }
    } catch (error) {
      console.error('加载表格数据失败：', error);
      tableData.value = [];
      pagination.value.total = 0;
    } finally {
      loading.value = false;
    }
  };

  const tableContext = reactive({
    columns: options.columns,
    dataSource: tableData,
    pagination,
    loading,
    onChange: (pag: any) => {
      pagination.value.current = pag.current || 1;
      pagination.value.pageSize = pag.pageSize || 10;
      loadData();
    },
  });

  const setProps = (props: any) => {
    Object.assign(tableContext, props);
  };

  return {
    tableContext,
    loadData,
    reload: loadData,
    setSearchInfo: (info: any) => {
      searchInfo.value = info;
      pagination.value.current = 1;
      loadData();
    },
    setProps,
  };
}

const router = useRouter();
const loading = ref(false);

const columns = [
  {
    title: '会员ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '会员姓名',
    dataIndex: 'name',
    width: 100,
  },
  {
    title: '性别',
    dataIndex: 'gender',
    width: 80,
    customRender: ({ text }: { text: number | string }) =>
      Number(text) === 1 ? '男' : '女',
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    width: 120,
  },
  {
    title: '会员类型',
    dataIndex: 'membership_type',
    width: 100,
  },
  {
    title: '开始日期',
    dataIndex: 'join_date',
    width: 120,
  },
  {
    title: '到期日期',
    dataIndex: 'expire_date',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 80,
    customRender: ({ text }: { text: number }) => {
      const status = Number(text);
      const color = status === 1 ? 'success' : 'error';
      const textValue = status === 1 ? '有效' : '过期';
      return h(Tag, { color }, () => textValue);
    },
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 200,
    fixed: 'right' as const,
    customRender: ({ record }: { record: MemberApi.MemberInfo }) => {
      return h(
        Space,
        {},
        {
          default: () => [
            h(
              Button,
              {
                type: 'primary',
                size: 'small',
                onClick: () => handleEdit(record),
              },
              {
                default: () => '编辑',
                icon: () => h(EditOutlined),
              },
            ),
            h(
              Popconfirm,
              {
                title: '确定删除此会员吗？',
                onConfirm: () => handleDelete(record),
              },
              {
                default: () =>
                  h(
                    Button,
                    {
                      type: 'primary',
                      size: 'small',
                      danger: true,
                    },
                    {
                      default: () => '删除',
                      icon: () => h(DeleteOutlined),
                    },
                  ),
              },
            ),
          ],
        },
      );
    },
  },
];

const searchFormSchema = [
  {
    field: 'name',
    label: '姓名',
    component: 'Input',
    colProps: { span: 6 },
  },
  {
    field: 'phone',
    label: '手机号',
    component: 'Input',
    colProps: { span: 6 },
  },
  {
    field: 'membership_type',
    label: '会员类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '月卡', value: '月卡' },
        { label: '季卡', value: '季卡' },
        { label: '年卡', value: '年卡' },
        { label: '私教', value: '私教' },
      ],
    },
    colProps: { span: 6 },
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      options: [
        { label: '有效', value: 1 },
        { label: '过期', value: 0 },
      ],
    },
    colProps: { span: 6 },
  },
];

const handleDelete = async (record: MemberApi.MemberInfo) => {
  try {
    await deleteMemberApi(record.id);
    reload();
  } catch (error: any) {
    console.error('删除失败：', error);
  }
};

const handleEdit = (record: MemberApi.MemberInfo) => {
  router.push(`/member/edit/${record.id}`);
};

const { tableContext, reload, setProps } = useTable({
  api: getMemberListApi,
  columns,
  useSearchForm: true,
  formConfig: {
    schemas: searchFormSchema,
  },
  pagination: {
    pageSize: 10,
  },
});

const handleCreate = () => {
  router.push('/member/create');
};

onMounted(() => {
  setProps({
    striped: true,
    size: 'middle',
  });
  reload();
});
</script>

<template>
  <div class="p-5">
    <Card title="会员列表" class="mb-4">
      <template #extra>
        <Space>
          <Button type="primary" @click="handleCreate">
            <PlusOutlined />新增会员
          </Button>
        </Space>
      </template>
      <p>管理健身房的所有会员，包括添加、编辑和删除会员信息。</p>
    </Card>

    <div class="flex flex-col lg:flex-row">
      <div class="w-full">
        <Card title="会员列表" :loading="loading">
          <Table
            :columns="columns"
            :data-source="tableContext.dataSource"
            :pagination="{
              current: tableContext.pagination.current,
              pageSize: tableContext.pagination.pageSize,
              total: tableContext.pagination.total,
            }"
            row-key="id"
            @change="
              (pag) => {
                tableContext.pagination.current = pag.current || 1;
                tableContext.onChange(pag);
              }
            "
          />
        </Card>
      </div>
    </div>
  </div>
</template>
