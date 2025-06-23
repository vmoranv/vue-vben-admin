<script lang="ts" setup>
import type { TablePaginationConfig } from 'ant-design-vue';

import type { StaffApi } from '../../api/modules/staff';

import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Avatar,
  Button,
  Card,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { deleteStaffApi, getStaffListApi } from '../../api/modules/staff';

defineOptions({ name: 'StaffList' });

const router = useRouter();
const loading = ref(false);
const tableData = ref<StaffApi.StaffInfo[]>([]);

const searchParams = reactive({
  name: '',
  role: undefined,
  status: undefined,
});

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条数据`,
});

const columns = [
  {
    title: '头像',
    dataIndex: 'avatar',
    width: 80,
  },
  {
    title: '姓名',
    dataIndex: 'name',
    width: 100,
  },
  {
    title: '用户名',
    dataIndex: 'username',
    width: 120,
  },
  {
    title: '角色',
    dataIndex: 'role',
    width: 120,
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    width: 130,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    width: 180,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 120,
    fixed: 'right' as const,
  },
];

function getRoleTagColor(role: string) {
  switch (role) {
    case 'admin': {
      return 'purple';
    }
    case 'coach': {
      return 'green';
    }
    case 'manager': {
      return 'blue';
    }
    case 'reception': {
      return 'cyan';
    }
    default: {
      return 'default';
    }
  }
}

function getRoleName(role: string) {
  switch (role) {
    case 'admin': {
      return '超级管理员';
    }
    case 'coach': {
      return '教练';
    }
    case 'manager': {
      return '管理员';
    }
    case 'reception': {
      return '前台';
    }
    default: {
      return '未知';
    }
  }
}

async function fetchStaffList() {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...searchParams,
    };

    const response = await getStaffListApi(params);
    tableData.value = response.list || [];
    pagination.total = response.pagination?.total || 0;
  } catch (error) {
    console.error('获取人员列表失败:', error);
    message.error('获取人员列表失败');
  } finally {
    loading.value = false;
  }
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchStaffList();
}

function handleSearch() {
  pagination.current = 1;
  fetchStaffList();
}

function handleReset() {
  searchParams.name = '';
  searchParams.role = undefined;
  searchParams.status = undefined;
  pagination.current = 1;
  fetchStaffList();
}

function handleCreate() {
  router.push('/staff/create');
}

function handleEdit(record: any) {
  router.push(`/staff/edit/${record.id}`);
}

async function handleDelete(record: any) {
  try {
    await deleteStaffApi(record.id);
    message.success('删除成功');
    fetchStaffList();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
}

onMounted(() => {
  fetchStaffList();
});
</script>

<template>
  <div>
    <Card>
      <div class="mb-4 flex justify-between">
        <div class="flex items-center">
          <Space>
            <Input
              v-model:value="searchParams.name"
              placeholder="请输入姓名"
              allow-clear
              style="width: 200px"
              @change="handleSearch"
            />
            <Select
              v-model:value="searchParams.role"
              placeholder="选择角色"
              style="width: 200px"
              allow-clear
              @change="handleSearch"
            >
              <Select.Option value="admin">超级管理员</Select.Option>
              <Select.Option value="manager">管理员</Select.Option>
              <Select.Option value="coach">教练</Select.Option>
              <Select.Option value="reception">前台</Select.Option>
            </Select>
            <Select
              v-model:value="searchParams.status"
              placeholder="选择状态"
              style="width: 200px"
              allow-clear
              @change="handleSearch"
            >
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </div>
        <div>
          <Button type="primary" @click="handleCreate">新增人员</Button>
        </div>
      </div>
      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :row-key="(record) => record.id"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'role'">
            <span>
              <Tag :color="getRoleTagColor(record.role)">
                {{ getRoleName(record.role) }}
              </Tag>
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <span>
              <Tag :color="record.status === 'active' ? 'success' : 'error'">
                {{ record.status === 'active' ? '活跃' : '停用' }}
              </Tag>
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'avatar'">
            <Avatar :src="record.avatar" :size="40">
              {{ record.name?.charAt(0) }}
            </Avatar>
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">
                编辑
              </Button>
              <Popconfirm
                title="确认删除此人员吗?"
                @confirm="handleDelete(record)"
                ok-text="确定"
                cancel-text="取消"
              >
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
