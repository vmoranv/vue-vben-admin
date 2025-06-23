<script lang="ts" setup>
import { onMounted, ref, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Button, Card, Form, message, Select, Input, DatePicker, InputNumber, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createCourseApi,
  getCourseDetailApi,
  updateCourseApi,
  getCoachesApi,
} from '../../api/modules/courses';

const { Option: SelectOption } = Select;

interface CourseFormData {
  name: string;
  coach_id: number | undefined;
  course_type: string;
  start_time: any;
  end_time: any;
  capacity: number;
  price: number;
}

defineOptions({ name: 'CourseEdit' });

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const isEdit = ref(false);
const courseId = ref<null | number>(null);
const formRef = ref();

const formData = ref<CourseFormData>({
  name: '',
  coach_id: undefined,
  course_type: '',
  start_time: undefined,
  end_time: undefined,
  capacity: 1,
  price: 0,
});

const coachOptions = ref<{ label: string; value: number }[]>([]);

async function loadCoachOptions() {
  try {
    const response = await getCoachesApi();
    
    if (Array.isArray(response)) {
      coachOptions.value = response.map((coach: any) => ({
        label: coach.realName || coach.username,
        value: coach.id
      }));
    } 
    else if (response && typeof response === 'object' && 'data' in response) {
      const responseObj = response as any;
      if (responseObj.code === 0 && Array.isArray(responseObj.data)) {
        coachOptions.value = responseObj.data.map((coach: any) => ({
          label: coach.realName || coach.username,
          value: coach.id
        }));
      }
    }
  } catch (error) {
    console.error('获取教练列表失败:', error);
    message.error('无法加载教练列表');
  }
}

onMounted(async () => {
  await loadCoachOptions();
  
  const id = route.params.id;
  if (id) {
    isEdit.value = true;
    courseId.value = Number(id);

    await nextTick();
    
    await loadCourseInfo(courseId.value);

    await nextTick();
  }
});

async function handleFormSubmit(values: CourseFormData) {
  try {
    loading.value = true;
    
    const formattedValues = {
      ...values,
      start_time: values.start_time ? dayjs(values.start_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      end_time: values.end_time ? dayjs(values.end_time).format('YYYY-MM-DD HH:mm:ss') : undefined
    };
    
    if (isEdit.value && courseId.value) {
      await updateCourseApi(courseId.value, formattedValues);
      message.success('更新课程成功');
    } else {
      await createCourseApi(formattedValues);
      message.success('创建课程成功');
      resetFields();
    }
    loading.value = false;
    router.push('/course');
  } catch (error) {
    loading.value = false;
    message.error(isEdit.value ? '更新课程失败' : '创建课程失败');
    console.error('操作失败：', error);
  }
}

async function loadCourseInfo(id: number) {
  try {
    const response = await getCourseDetailApi(id);
    
    let courseData: any;
    if (response && typeof response === 'object' && 'code' in response && response.code === 0 && response.data) {
      courseData = response.data;
    } else if (response && !('code' in response)) {
      courseData = response;
    } else {
      console.error('响应数据格式错误:', response);
      message.error('获取课程信息失败');
      return;
    }
    
    const newFormData = {
      name: courseData.name || '',
      coach_id: courseData.coach_id || undefined,
      course_type: courseData.course_type || '',
      start_time: courseData.start_time ? dayjs(courseData.start_time) : undefined,
      end_time: courseData.end_time ? dayjs(courseData.end_time) : undefined,
      capacity: courseData.capacity || 1,
      price: Number(courseData.price) || 0,
    };
    
    Object.assign(formData.value, newFormData);
    
    await nextTick();
    
    if (formRef.value) {
      formRef.value.clearValidate();
      await nextTick();
    } else {
      console.error('表单引用不存在');
    }
  } catch (error) {
    console.error('加载课程信息失败:', error);
    message.error('加载课程信息失败');
  }
}

function resetFields() {
  if (formRef.value) {
    formRef.value.resetFields();
  }
}

</script>

<template>
  <div>
    <Card title="编辑课程" :bordered="false">
      <template #extra>
        <Button @click="() => router.push('/course')">返回</Button>
      </template>

      <Form
        ref="formRef"
        :model="formData"
        layout="vertical"
        @finish="handleFormSubmit"
      >
        <Form.Item
          name="name"
          label="课程名称"
          :rules="[{ required: true, message: '请输入课程名称' }]"
        >
          <Input 
            v-model:value="formData.name" 
            placeholder="请输入课程名称" 
          />
        </Form.Item>

        <Form.Item
          name="coach_id"
          label="教练"
          :rules="[{ required: true, message: '请选择教练' }]"
        >
          <Select 
            v-model:value="formData.coach_id" 
            placeholder="请选择教练"
            :loading="coachOptions.length === 0"
          >
            <SelectOption v-for="coach in coachOptions" :key="coach.value" :value="coach.value">
              {{ coach.label }}
            </SelectOption>
          </Select>
        </Form.Item>

        <Form.Item
          name="course_type"
          label="课程类型"
          :rules="[{ required: true, message: '请选择课程类型' }]"
        >
          <Select 
            v-model:value="formData.course_type" 
            placeholder="请选择课程类型"
          >
            <SelectOption value="团体课">团体课</SelectOption>
            <SelectOption value="私教课">私教课</SelectOption>
            <SelectOption value="特色课">特色课</SelectOption>
          </Select>
        </Form.Item>

        <Form.Item
          name="start_time"
          label="开始时间"
          :rules="[{ required: true, message: '请选择开始时间' }]"
        >
          <DatePicker 
            v-model:value="formData.start_time" 
            show-time 
            format="YYYY-MM-DD HH:mm:ss" 
            placeholder="请选择开始时间" 
            style="width: 100%"
          />
        </Form.Item>

        <Form.Item
          name="end_time"
          label="结束时间"
          :rules="[{ required: true, message: '请选择结束时间' }]"
        >
          <DatePicker 
            v-model:value="formData.end_time" 
            show-time 
            format="YYYY-MM-DD HH:mm:ss" 
            placeholder="请选择结束时间" 
            style="width: 100%"
          />
        </Form.Item>

        <Form.Item
          name="capacity"
          label="课程容量"
          :rules="[{ required: true, message: '请输入课程容量' }]"
        >
          <InputNumber 
            v-model:value="formData.capacity" 
            :min="1" 
            :max="100" 
            placeholder="请输入课程容量" 
            style="width: 100%"
          />
        </Form.Item>

        <Form.Item
          name="price"
          label="课程价格"
          :rules="[{ required: true, message: '请输入课程价格' }]"
        >
          <InputNumber 
            v-model:value="formData.price" 
            :min="0" 
            :step="0.01" 
            :precision="2"
            placeholder="请输入课程价格" 
            style="width: 100%"
          >
            <template #addonBefore>￥</template>
          </InputNumber>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" html-type="submit" :loading="loading">
              {{ isEdit ? '更新课程' : '创建课程' }}
            </Button>
            <Button @click="resetFields">重置</Button>
            <Button @click="() => router.push('/course')">取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>
