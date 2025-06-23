<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import { 
  Button, 
  Card, 
  Form, 
  message, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker,
  Row,
  Col 
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { 
  getFinancialRecordDetailApi, 
  updateFinancialRecordApi 
} from '../../api/modules/financial';

defineOptions({ name: 'FinancialEdit' });

const router = useRouter();
const route = useRoute();
const financialId = Number(route.params.id);
const formRef = ref();
const loading = ref(false);

// 表单数据
const formData = ref({
  record_type: '',
  amount: 0,
  record_date: null as any,
  payment_method: '',
  description: '',
  member_id: null as number | null,
  coach_id: null as number | null,
});

// 表单验证规则
const rules = {
  record_type: [{ required: true, message: '请选择记录类型' }],
  amount: [{ required: true, message: '请输入金额' }],
  record_date: [{ required: true, message: '请选择记录日期' }],
};

// 记录类型选项
const recordTypeOptions = [
  { label: '会员费', value: '会员费' },
  { label: '私教费', value: '私教费' },
  { label: '其他收入', value: '其他收入' },
  { label: '支出', value: '支出' },
];

// 支付方式选项
const paymentMethodOptions = [
  { label: '现金', value: '现金' },
  { label: '银行卡', value: '银行卡' },
  { label: '支付宝', value: '支付宝' },
  { label: '微信', value: '微信' },
  { label: '其他', value: '其他' },
];

// 获取财务记录详情
async function getFinancialDetail() {
  if (!financialId) {
    message.error('记录ID无效');
    router.push('/financial');
    return;
  }

  try {
    loading.value = true;
    const res: any = await getFinancialRecordDetailApi(financialId);

    const record = res.data || res;
    
    if (record && record.id) {
      formData.value = {
        record_type: record.record_type || '',
        amount: record.amount || 0,
        record_date: record.record_date ? dayjs(record.record_date) : null,
        payment_method: record.payment_method || '',
        description: record.description || '',
        member_id: record.member_id || null,
        coach_id: record.coach_id || null,
      };
    } else {
      message.error('获取财务记录详情失败：数据为空');
      router.push('/financial');
    }
  } catch (error) {
    console.error('获取财务记录详情失败', error);
    message.error('获取财务记录详情失败');
    router.push('/financial');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    loading.value = true;
    
    const submitData = {
      record_type: formData.value.record_type,
      amount: formData.value.amount,
      record_date: formData.value.record_date ? 
        formData.value.record_date.format('YYYY-MM-DD') : '',
      payment_method: formData.value.payment_method || undefined,
      description: formData.value.description || undefined,
      member_id: formData.value.member_id || undefined,
      coach_id: formData.value.coach_id || undefined,
    };
    
    await updateFinancialRecordApi(financialId, submitData);
    message.success('更新财务记录成功');
    router.push('/financial');
  } catch (error) {
    console.error('更新财务记录失败', error);
    message.error('更新财务记录失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  router.push('/financial');
}

onMounted(() => {
  getFinancialDetail();
});
</script>

<template>
  <div class="p-4">
    <Card title="编辑财务记录">
      <Form 
        ref="formRef" 
        :model="formData" 
        :rules="rules"
        layout="vertical"
        :loading="loading"
      >
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="记录类型" name="record_type">
              <Select 
                v-model:value="formData.record_type"
                placeholder="请选择记录类型"
                :options="recordTypeOptions"
              />
            </Form.Item>
          </Col>
          
          <Col :span="12">
            <Form.Item label="金额" name="amount">
              <InputNumber
                v-model:value="formData.amount"
                placeholder="请输入金额"
                :min="0"
                :precision="2"
                style="width: 100%"
                addon-before="¥"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="记录日期" name="record_date">
              <DatePicker
                v-model:value="formData.record_date"
                placeholder="请选择记录日期"
                style="width: 100%"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          
          <Col :span="12">
            <Form.Item label="支付方式" name="payment_method">
              <Select 
                v-model:value="formData.payment_method"
                placeholder="请选择支付方式"
                :options="paymentMethodOptions"
                allow-clear
              />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col :span="24">
            <Form.Item label="备注" name="description">
              <Input.TextArea
                v-model:value="formData.description"
                placeholder="请输入备注信息"
                :rows="3"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button 
            type="primary" 
            :loading="loading" 
            @click="handleSubmit"
          >
            保存
          </Button>
          <Button 
            style="margin-left: 8px" 
            @click="handleCancel"
          >
            取消
          </Button>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>
