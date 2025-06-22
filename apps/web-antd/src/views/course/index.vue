<script lang="ts" setup>
import type { CourseInfo } from '../../api/modules/courses';

import { h, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ScheduleOutlined,
} from '@ant-design/icons-vue';
import { Button, Card, DatePicker, Form, Input, message, Popconfirm, Space, Table } from 'ant-design-vue';

import { deleteCourseApi, getCourseListApi } from '../../api/modules/courses';

defineOptions({ name: 'CourseManagement' });

const router = useRouter();
const loading = ref(false);
const courses = ref<CourseInfo[]>([]);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 查询表单
const searchForm = reactive({
  name: '',
  coach_name: '',
  start_date: undefined,
  end_date: undefined,
});

// 重置查询
function resetSearch() {
  searchForm.name = '';
  searchForm.coach_name = '';
  searchForm.start_date = undefined;
  searchForm.end_date = undefined;
  pagination.value.current = 1;
  loadCourses();
}

// 执行查询
function handleSearch() {
  pagination.value.current = 1;
  loadCourses();
}

// 获取课程列表
async function loadCourses() {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      ...searchForm,
    };
    
    const response = await getCourseListApi(params);
    
    if (response && response.list) {
      courses.value = response.list.map((course: any) => ({
        ...course,
        coachName: course.coach_name || course.coachName || '-',
        startTime: course.start_time || course.startTime,
        endTime: course.end_time || course.endTime,
        maxParticipants: course.capacity || course.maxParticipants || 0,
        currentParticipants: course.booking_count || course.currentParticipants || 0,
      }));
      pagination.value.total = response.pagination?.total || 0;
    } else if (response && Array.isArray(response)) {
      courses.value = response.map((course: any) => ({
        ...course,
        coachName: course.coach_name || course.coachName || '-',
        startTime: course.start_time || course.startTime,
        endTime: course.end_time || course.endTime,
        maxParticipants: course.capacity || course.maxParticipants || 0,
        currentParticipants: course.booking_count || course.currentParticipants || 0,
      }));
      pagination.value.total = response.length;
    } else {
      courses.value = [];
      pagination.value.total = 0;
    }
  } catch (error) {
    console.error('获取课程列表失败:', error);
    message.error('获取课程列表失败');
    courses.value = [];
    pagination.value.total = 0;
  } finally {
    loading.value = false;
  }
}

// 创建课程
function handleCreateCourse() {
  router.push('/course/create');
}

// 编辑课程
function handleEditCourse(id: number) {
  router.push(`/course/edit/${id}`);
}

// 删除课程
async function handleDeleteCourse(id: number) {
  try {
    await deleteCourseApi(id);
    message.success('删除课程成功');
    loadCourses();
  } catch (error) {
    console.error('删除课程失败:', error);
    message.error('删除课程失败');
  }
}

// 查看特定课程的预约情况
function viewCourseBookings(courseId: number, courseName: string) {
  router.push({
    path: '/course/bookings',
    query: { course_id: courseId, course_name: courseName },
  });
}

// 表格列定义
const columns = [
  {
    title: '课程ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '课程名称',
    dataIndex: 'name',
    width: 150,
    ellipsis: true,
  },
  {
    title: '教练',
    dataIndex: 'coachName',
    width: 100,
    customRender: ({ text }: { text: string }) => text || '-',
  },
  {
    title: '开始时间',
    dataIndex: 'startTime',
    width: 150,
    customRender: ({ text }: { text: string }) => {
      return text ? new Date(text).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : '-';
    },
  },
  {
    title: '结束时间',
    dataIndex: 'endTime',
    width: 150,
    customRender: ({ text }: { text: string }) => {
      return text ? new Date(text).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : '-';
    },
  },
  {
    title: '最大人数',
    dataIndex: 'maxParticipants',
    width: 100,
    customRender: ({ text }: { text: number }) => text || 0,
  },
  {
    title: '已预约人数',
    dataIndex: 'currentParticipants',
    width: 120,
    customRender: ({ text }: { text: number }) => text || 0,
  },
  {
    title: '操作',
    key: 'action',
    width: 250,
    customRender: ({ record }: { record: CourseInfo }) => {
      return h(Space, {}, {
        default: () => [
          h(
            Button,
            {
              type: 'link',
              size: 'small',
              onClick: () => handleEditCourse(record.id),
            },
            { default: () => [h(EditOutlined), '编辑'] },
          ),
          h(
            Button,
            {
              type: 'default',
              size: 'small',
              onClick: () => viewCourseBookings(record.id, record.name),
            },
            { default: () => [h(ScheduleOutlined), '查看预约'] },
          ),
          h(
            Popconfirm,
            {
              title: '确定要删除这个课程吗？',
              onConfirm: () => handleDeleteCourse(record.id),
            },
            {
              default: () => h(
                Button,
                {
                  danger: true,
                  size: 'small',
                },
                { default: () => [h(DeleteOutlined), '删除'] }
              ),
            }
          ),
        ]
      });
    },
  },
];

// 处理表格分页变化
function handleTableChange(pag: any) {
  pagination.value.current = pag.current || 1;
  pagination.value.pageSize = pag.pageSize || 10;
  loadCourses();
}

// 页面加载时获取课程列表
onMounted(() => {
  loadCourses();
});
</script>

<template>
  <div class="p-5">
    <Card title="课程管理" class="mb-4">
      <template #extra>
        <Space>
          <Button type="primary" @click="handleCreateCourse">
            <PlusOutlined />添加课程
          </Button>
          <Button @click="router.push('/course/bookings')"> <ScheduleOutlined />课程预约 </Button>
        </Space>
      </template>
      <p>管理健身房的所有课程，包括添加、编辑和删除课程。</p>
    </Card>

    <!-- 查询区域 -->
    <Card title="查询条件" class="mb-4">
      <Form layout="inline" :model="searchForm">
        <Form.Item label="课程名称" name="name">
          <Input
            v-model:value="searchForm.name"
            placeholder="请输入课程名称"
            style="width: 200px"
            allowClear
          />
        </Form.Item>
        <Form.Item label="教练姓名" name="coach_name">
          <Input
            v-model:value="searchForm.coach_name"
            placeholder="请输入教练姓名"
            style="width: 200px"
            allowClear
          />
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
        <Form.Item>
          <Button type="primary" @click="handleSearch">搜索</Button>
          <Button style="margin-left: 8px" @click="resetSearch">重置</Button>
        </Form.Item>
      </Form>
    </Card>

    <div class="flex flex-col lg:flex-row">
      <div class="w-full">
        <Card title="课程列表" :loading="loading">
          <Table
            :columns="columns"
            :data-source="courses"
            :pagination="{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }"
            row-key="id"
            @change="handleTableChange"
          />
        </Card>
      </div>
    </div>
  </div>
</template>
