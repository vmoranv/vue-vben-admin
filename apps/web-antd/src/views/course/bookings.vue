<script setup lang="ts">
import type { TablePaginationConfig } from 'ant-design-vue';
import type {
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
} from 'ant-design-vue/es/table/interface';

import { h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  bookCourseApi,
  cancelBookingApi,
  getCourseBookingsApi,
  getCourseListApi,
} from '../../api/modules/courses';
import { getMemberOptionsApi } from '../../api/modules/members';


interface BookingRecord {
  id: number;
  course_name: string;
  member_name: string;
  member_phone: string;
  course_time: string;
  status: number;
  created_at: string;
}

defineOptions({ name: 'CourseBookings' });

const router = useRouter();
const loading = ref(false);
const showBookForm = ref(false);
const loadingRef = ref(false);
const tableBinding = ref({});

const columns = [
  {
    title: '预约ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '课程名称',
    dataIndex: 'course_name',
    width: 150,
  },
  {
    title: '会员姓名',
    dataIndex: 'member_name',
    width: 100,
  },
  {
    title: '会员手机',
    dataIndex: 'member_phone',
    width: 120,
  },
  {
    title: '课程时间',
    dataIndex: 'course_time',
    width: 180,
  },
  {
    title: '预约状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ text }: { text: number }) => {
      const status = Number(text);
      const color = status === 1 ? 'success' : 'default';
      const statusText = status === 1 ? '已预约' : '已取消';
      return h(Tag, { color }, () => statusText);
    },
  },
  {
    title: '预约时间',
    dataIndex: 'created_at',
    width: 150,
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    customRender: ({ record }: { record: BookingRecord }) => {
      return h(
        Space,
        {},
        {
          default: () => [
            h(
              Popconfirm,
              {
                title: '确定要取消预约吗?',
                onConfirm: () => handleCancelBooking(record.id),
                disabled: record.status !== 1,
              },
              {
                default: () =>
                  h(
                    Button,
                    {
                      danger: true,
                      type: 'link',
                      size: 'small',
                      disabled: record.status !== 1,
                    },
                    () => '取消预约',
                  ),
              },
            ),
          ],
        },
      );
    },
  },
];

const searchForm = ref({
  member_name: '',
  course_name: '',
  status: undefined,
});

const paginationConfig = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

const dataSource = ref<BookingRecord[]>([]);

async function loadData(params = {}) {
  try {
    loadingRef.value = true;
    const response = await getCourseBookingsApi({
      page: paginationConfig.value.current,
      pageSize: paginationConfig.value.pageSize,
      ...params,
    });

    dataSource.value = response.list || [];
    paginationConfig.value.total = response.pagination?.total || 0;

    loadingRef.value = false;
  } catch (error) {
    loadingRef.value = false;
    console.error('加载预约数据失败：', error);
    message.error('获取预约数据失败');
  }
}

function handleReset() {
  searchForm.value = {
    member_name: '',
    course_name: '',
    status: undefined,
  };
  paginationConfig.value.current = 1;
  loadData();
}

function handleTableChange(
  pagination: TablePaginationConfig,
  _filters: Record<string, FilterValue | null>,
  _sorter: SorterResult<BookingRecord> | SorterResult<BookingRecord>[],
  _extra: TableCurrentDataSource<BookingRecord>,
) {
  if (pagination.current) {
    paginationConfig.value.current = pagination.current;
  }
  if (pagination.pageSize) {
    paginationConfig.value.pageSize = pagination.pageSize;
  }
  loadData(searchForm.value);
}

async function handleCancelBooking(id: number) {
  try {
    loading.value = true;
    await cancelBookingApi(id);
    loadData(searchForm.value);
    loading.value = false;
  } catch (error) {
    loading.value = false;
    console.error('取消预约失败：', error);
  }
}

const bookingFormSchema = ref({
  course_id: undefined as number | undefined,
  member_id: undefined as number | undefined,
});

const courseOptions = ref<{ label: string; value: number }[]>([]);
const memberOptions = ref<{ label: string; value: number }[]>([]);

async function loadOptions() {
  try {
    
    const memberResponse = await getMemberOptionsApi();
    
    memberOptions.value = Array.isArray(memberResponse) 
      ? memberResponse.map((member: any) => ({
          label: `${member.name} (${member.phone})`,
          value: member.id
        }))
      : [];

    const courseResponse = await getCourseListApi({ 
      page: 1, 
      pageSize: 100,
      status: 1
    });
    
    courseOptions.value = courseResponse?.list?.map((course: any) => ({
      label: `${course.name} - ${course.start_time}`,
      value: course.id
    })) || [];
  } catch (error) {
    console.error('❌ 加载选项数据失败：', error);
    message.error('获取数据失败');
  }
}

async function handleBooking() {
  try {
    if (
      !bookingFormSchema.value.course_id ||
      !bookingFormSchema.value.member_id
    ) {
      return;
    }

    loading.value = true;
    await bookCourseApi({
      course_id: bookingFormSchema.value.course_id,
      member_id: bookingFormSchema.value.member_id,
    });
    showBookForm.value = false;
    loadData(searchForm.value);
    loading.value = false;
  } catch (error) {
    loading.value = false;
    console.error('添加预约失败：', error);
  }
}

function showNewBookingForm() {
  showBookForm.value = true;
}

function handleBack() {
  router.back();
}

onMounted(() => {
  loadData();
  loadOptions();
});
</script>

<template>
  <div>
    <Card title="课程预约管理">
      <template #extra>
        <Space>
          <Button type="primary" @click="showNewBookingForm">添加预约</Button>
          <Button @click="handleReset">重置</Button>
          <Button @click="handleBack">返回</Button>
        </Space>
      </template>

      <!-- 添加搜索表单 -->
      <div class="mb-4">
        <Form layout="inline">
          <Form.Item label="会员姓名">
            <Input
              v-model:value="searchForm.member_name"
              placeholder="搜索会员姓名"
            />
          </Form.Item>
          <Form.Item label="课程名称">
            <Input
              v-model:value="searchForm.course_name"
              placeholder="搜索课程名称"
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              v-model:value="searchForm.status"
              placeholder="选择状态"
              style="width: 120px"
            >
              <Select.Option :value="undefined">全部</Select.Option>
              <Select.Option :value="1">已预约</Select.Option>
              <Select.Option :value="2">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              @click="
                () => {
                  paginationConfig.current = 1;
                  loadData(searchForm);
                }
              "
            >
              搜索
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Table
        v-bind="tableBinding"
        :columns="columns"
        :data-source="dataSource"
        :loading="loadingRef"
        :pagination="paginationConfig"
        @change="handleTableChange"
      />
    </Card>

    <!-- 预约表单弹窗 -->
    <Modal
      v-model:visible="showBookForm"
      title="添加课程预约"
      @ok="handleBooking"
      :confirm-loading="loading"
    >
      <Form :model="bookingFormSchema" layout="horizontal">
        <Form.Item
          label="课程"
          name="course_id"
          :rules="[{ required: true, message: '请选择课程' }]"
        >
          <Select
            v-model:value="bookingFormSchema.course_id"
            placeholder="请选择课程"
          >
            <Select.Option
              v-for="course in courseOptions"
              :key="course.value"
              :value="course.value"
            >
              {{ course.label }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="会员"
          name="member_id"
          :rules="[{ required: true, message: '请选择会员' }]"
        >
          <Select
            v-model:value="bookingFormSchema.member_id"
            placeholder="请选择会员"
          >
            <Select.Option
              v-for="member in memberOptions"
              :key="member.value"
              :value="member.value"
            >
              {{ member.label }}
            </Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
