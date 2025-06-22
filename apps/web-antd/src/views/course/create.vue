<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Textarea,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { createCourseApi, getCoachesApi } from '../../api/modules/courses';

defineOptions({ name: 'CourseCreate' });

const router = useRouter();
const loading = ref(false);
const formRef = ref();

// 表单数据
const formData = ref({
  name: '',
  coach_id: undefined as number | undefined,
  course_type: '',
  start_time: undefined as any,
  end_time: undefined as any,
  capacity: 1,
  price: 0,
  location: '',
  remark: '',
});

// 教练选项数据
const coachOptions = ref<{ label: string; value: number }[]>([]);

// 课程类型选项
const courseTypeOptions = [
  { label: '团体课', value: '团体课' },
  { label: '私教课', value: '私教课' },
  { label: '瑜伽课', value: '瑜伽课' },
  { label: '力量训练', value: '力量训练' },
  { label: '有氧运动', value: '有氧运动' },
  { label: '舞蹈课', value: '舞蹈课' },
];

// 表单验证规则
const rules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '请输入课程名称', trigger: 'blur' },
    { min: 2, max: 50, message: '课程名称长度在2-50个字符', trigger: 'blur' },
  ],
  coach_id: [{ required: true, message: '请选择教练', trigger: 'change' }],
  course_type: [
    { required: true, message: '请选择课程类型', trigger: 'change' },
  ],
  start_time: [
    { required: true, message: '请选择开始时间', trigger: 'change' },
  ],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  capacity: [
    { required: true, message: '请输入课程容量', trigger: 'blur' },
    {
      type: 'number',
      min: 1,
      max: 100,
      message: '容量必须在1-100之间',
      trigger: 'blur',
    },
  ],
  price: [
    { required: true, message: '请输入课程价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能为负数', trigger: 'blur' },
  ],
};

// 在组件加载时获取教练列表
onMounted(() => {
  loadCoachOptions();
});

// 加载教练选项
async function loadCoachOptions() {
  try {
    loading.value = true;
    
    const response = await getCoachesApi();

    if (Array.isArray(response)) {
      coachOptions.value = response.map((coach: any) => ({
        label: coach.realName || coach.username,
        value: coach.id
      }));
    } else if (response && typeof response === 'object' && 'data' in response) {
      const responseObj = response as any;
      if (responseObj.code === 0 && Array.isArray(responseObj.data)) {
        coachOptions.value = responseObj.data.map((coach: any) => ({
          label: coach.realName || coach.username,
          value: coach.id
        }));
      } else {
        message.warning(responseObj.message || '获取教练列表失败');
      }
    } else {
      message.warning('无法获取教练列表');
    }
    loading.value = false;
  } catch (error) {
    console.error('获取教练列表失败:', error);
    message.error('无法加载教练列表');
    loading.value = false;
  }
}

// 表单提交
async function handleSubmit() {
  try {
    await formRef.value.validate();
    loading.value = true;

    const submitData = {
      ...formData.value,
      start_time: formData.value.start_time
        ? dayjs(formData.value.start_time).format('YYYY-MM-DD HH:mm:ss')
        : undefined,
      end_time: formData.value.end_time
        ? dayjs(formData.value.end_time).format('YYYY-MM-DD HH:mm:ss')
        : undefined,
    };

    await createCourseApi(submitData);
    message.success('创建课程成功');
    router.push('/course');
  } catch (error) {
    console.error('创建课程失败：', error);
    message.error('创建课程失败，请重试');
  } finally {
    loading.value = false;
  }
}

// 重置表单
function handleReset() {
  formRef.value.resetFields();
}

// 返回列表
function handleBack() {
  router.push('/course');
}

// 时间选择限制
function disabledDate(current: any) {
  return current && current < dayjs().startOf('day');
}

// 结束时间限制
function disabledEndTime(current: any) {
  const startTime = formData.value.start_time;
  if (!startTime) return false;

  return current && current <= dayjs(startTime);
}
</script>

<template>
  <div>
    <Card title="创建课程" :bordered="false">
      <template #extra>
        <Button @click="handleBack">返回</Button>
      </template>

      <Form
        ref="formRef"
        :model="formData"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <Form.Item label="课程名称" name="name">
          <Input v-model:value="formData.name" placeholder="请输入课程名称" />
        </Form.Item>

        <Form.Item label="教练" name="coach_id">
          <Select
            v-model:value="formData.coach_id"
            placeholder="请选择教练"
            :options="coachOptions"
          />
        </Form.Item>

        <Form.Item label="课程类型" name="course_type">
          <Select
            v-model:value="formData.course_type"
            placeholder="请选择课程类型"
            :options="courseTypeOptions"
          />
        </Form.Item>

        <Form.Item label="开始时间" name="start_time">
          <DatePicker
            v-model:value="formData.start_time"
            :disabled-date="disabledDate"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </Form.Item>

        <Form.Item label="结束时间" name="end_time">
          <DatePicker
            v-model:value="formData.end_time"
            :disabled-date="disabledEndTime"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </Form.Item>

        <Form.Item label="课程容量" name="capacity">
          <InputNumber
            v-model:value="formData.capacity"
            :min="1"
            :max="100"
            style="width: 100%"
          />
        </Form.Item>

        <Form.Item label="课程价格" name="price">
          <InputNumber
            v-model:value="formData.price"
            :min="0"
            addon-after="元"
            style="width: 100%"
          />
        </Form.Item>

        <Form.Item label="课程地点" name="location">
          <Input
            v-model:value="formData.location"
            placeholder="请输入课程地点"
          />
        </Form.Item>

        <Form.Item label="备注" name="remark">
          <Textarea
            v-model:value="formData.remark"
            :rows="4"
            placeholder="请输入备注信息"
          />
        </Form.Item>

        <Form.Item :wrapper-col="{ span: 18, offset: 6 }">
          <Space>
            <Button type="primary" @click="handleSubmit" :loading="loading">
              创建
            </Button>
            <Button @click="handleReset">重置</Button>
            <Button @click="handleBack">取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>
