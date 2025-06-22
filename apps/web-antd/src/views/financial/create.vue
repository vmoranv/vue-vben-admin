<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Button, Card, Form, message, Tabs, Input, InputNumber, Select, DatePicker } from 'ant-design-vue';

import { createFinancialRecordApi } from '../../api/modules/financial';

interface FormSchema {
  field: string;
  label: string;
  component: string;
  required?: boolean;
  defaultValue?: any;
  componentProps?: Record<string, any>;
  colProps?: Record<string, any>;
  rules?: any[];
  show?: ((renderCallbackParams: any) => boolean) | boolean;
}

interface CreateFinancialRecordParams {
  record_type: string;
  amount: number;
  record_date: string;
  payment_method?: string;
  description?: string;
  expense_type?: string;
}

defineOptions({ name: 'CreateFinancialRecord' });

const router = useRouter();
const loading = ref(false);
const activeKey = ref('income');

function useForm(options: {
  labelWidth?: number;
  schemas: FormSchema[];
  showActionButtonGroup?: boolean;
}) {
  const formData = ref<Record<string, any>>({});

  options.schemas.forEach((schema) => {
    if (schema.defaultValue !== undefined) {
      formData.value[schema.field] = schema.defaultValue;
    }
  });

  const formBinding = {
    labelWidth: options.labelWidth || 80,
    schemas: options.schemas,
    showActionButtonGroup: options.showActionButtonGroup || false,
    model: formData.value,
  };

  function getFieldsValue() {
    return formData.value;
  }

  function setFieldsValue(values: Record<string, any>) {
    Object.assign(formData.value, values);
  }

  function resetFields() {
    formData.value = {};
    options.schemas.forEach((schema) => {
      if (schema.defaultValue !== undefined) {
        formData.value[schema.field] = schema.defaultValue;
      }
    });
  }

  async function validate(): Promise<Record<string, any>> {
    return formData.value;
  }

  return {
    formBinding,
    getFieldsValue,
    setFieldsValue,
    resetFields,
    validate,
  };
}

const incomeFormSchema: FormSchema[] = [
  {
    field: 'record_type',
    label: '记录类型',
    component: 'Select',
    defaultValue: '会员费',
    required: true,
    componentProps: {
      options: [
        { label: '会员费', value: '会员费' },
        { label: '私教费', value: '私教费' },
        { label: '其他收入', value: '其他收入' },
      ],
    },
    colProps: { span: 12 },
  },
  {
    field: 'amount',
    label: '金额',
    component: 'InputNumber',
    required: true,
    componentProps: {
      style: { width: '100%' },
      min: 0,
      precision: 2,
      addonAfter: '元',
    },
    colProps: { span: 12 },
  },
  {
    field: 'record_date',
    label: '记录日期',
    component: 'DatePicker',
    required: true,
    componentProps: {
      valueFormat: 'YYYY-MM-DD',
      format: 'YYYY-MM-DD',
      style: { width: '100%' },
    },
    colProps: { span: 12 },
  },
  {
    field: 'payment_method',
    label: '支付方式',
    component: 'Select',
    defaultValue: '现金',
    componentProps: {
      options: [
        { label: '现金', value: '现金' },
        { label: '微信', value: '微信' },
        { label: '支付宝', value: '支付宝' },
        { label: '银行卡', value: '银行卡' },
      ],
    },
    colProps: { span: 12 },
  },
  {
    field: 'description',
    label: '描述',
    component: 'Input',
    componentProps: {
      type: 'textarea',
      rows: 3,
    },
    colProps: { span: 24 },
  },
];

const expenseFormSchema: FormSchema[] = [
  {
    field: 'record_type',
    label: '记录类型',
    component: 'Input',
    defaultValue: '支出',
    show: false,
  },
  {
    field: 'amount',
    label: '金额',
    component: 'InputNumber',
    required: true,
    componentProps: {
      style: { width: '100%' },
      min: 0,
      precision: 2,
      addonAfter: '元',
    },
    colProps: { span: 12 },
  },
  {
    field: 'record_date',
    label: '记录日期',
    component: 'DatePicker',
    required: true,
    componentProps: {
      valueFormat: 'YYYY-MM-DD',
      format: 'YYYY-MM-DD',
      style: { width: '100%' },
    },
    colProps: { span: 12 },
  },
  {
    field: 'payment_method',
    label: '支付方式',
    component: 'Select',
    defaultValue: '现金',
    componentProps: {
      options: [
        { label: '现金', value: '现金' },
        { label: '微信', value: '微信' },
        { label: '支付宝', value: '支付宝' },
        { label: '银行卡', value: '银行卡' },
      ],
    },
    colProps: { span: 12 },
  },
  {
    field: 'expense_type',
    label: '支出类型',
    component: 'Select',
    required: true,
    componentProps: {
      options: [
        { label: '水电费', value: '水电费' },
        { label: '房租', value: '房租' },
        { label: '设备维护', value: '设备维护' },
        { label: '员工工资', value: '员工工资' },
        { label: '其他支出', value: '其他支出' },
      ],
    },
    colProps: { span: 12 },
  },
  {
    field: 'description',
    label: '描述',
    component: 'Input',
    componentProps: {
      type: 'textarea',
      rows: 3,
    },
    colProps: { span: 24 },
  },
];

const {
  resetFields: resetIncomeFields,
  validate: validateIncome,
  formBinding: incomeFormBinding,
} = useForm({
  schemas: incomeFormSchema,
  labelWidth: 100,
});

const {
  resetFields: resetExpenseFields,
  validate: validateExpense,
  formBinding: expenseFormBinding,
} = useForm({
  schemas: expenseFormSchema,
  labelWidth: 100,
});

async function handleSubmit() {
  loading.value = true;
  try {
    let formData: CreateFinancialRecordParams;

    if (activeKey.value === 'income') {
      formData = (await validateIncome()) as CreateFinancialRecordParams;
    } else {
      formData = (await validateExpense()) as CreateFinancialRecordParams;
      if (formData.expense_type) {
        formData.description = `${formData.expense_type}: ${formData.description || ''}`;
      }
    }

    await createFinancialRecordApi(formData as CreateFinancialRecordParams);
    message.success('创建财务记录成功');
    router.push('/financial');
  } catch (error) {
    console.error('提交财务记录失败：', error);
    message.error('提交失败，请检查表单数据');
  } finally {
    loading.value = false;
  }
}

function handleBack() {
  router.push('/financial');
}
</script>

<template>
  <div>
    <Card title="创建财务记录" :bordered="false">
      <template #extra>
        <Button @click="handleBack">返回列表</Button>
      </template>

      <Tabs v-model:active-key="activeKey">
        <Tabs.TabPane key="income" tab="收入记录">
          <Form v-bind="incomeFormBinding" layout="horizontal">
            <!-- 动态渲染收入表单项 -->
            <Form.Item
              v-for="schema in incomeFormSchema"
              :key="schema.field"
              :label="schema.label"
              :name="schema.field"
              :rules="schema.required ? [{ required: true, message: `请输入${schema.label}` }] : undefined"
              :wrapper-col="schema.colProps"
            >
              <!-- 根据组件类型动态渲染 -->
              <template v-if="schema.component === 'Input'">
                <Input v-model:value="incomeFormBinding.model[schema.field]" v-bind="schema.componentProps || {}" />
              </template>
              <template v-else-if="schema.component === 'InputNumber'">
                <InputNumber v-model:value="incomeFormBinding.model[schema.field]" v-bind="schema.componentProps || {}" />
              </template>
              <template v-else-if="schema.component === 'Select'">
                <Select 
                  v-model:value="incomeFormBinding.model[schema.field]" 
                  v-bind="schema.componentProps || {}"
                  style="width: 100%"
                >
                  <Select.Option 
                    v-for="option in schema.componentProps?.options" 
                    :key="option.value" 
                    :value="option.value"
                  >
                    {{option.label}}
                  </Select.Option>
                </Select>
              </template>
              <template v-else-if="schema.component === 'DatePicker'">
                <DatePicker v-model:value="incomeFormBinding.model[schema.field]" v-bind="schema.componentProps || {}" style="width: 100%" />
              </template>
            </Form.Item>

            <div class="form-footer">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                提交
              </Button>
              <Button style="margin-left: 8px" @click="resetIncomeFields">
                重置
              </Button>
            </div>
          </Form>
        </Tabs.TabPane>

        <Tabs.TabPane key="expense" tab="支出记录">
          <Form v-bind="expenseFormBinding" layout="horizontal">
            <!-- 动态渲染支出表单项 -->
            <Form.Item
              v-for="schema in expenseFormSchema"
              :key="schema.field"
              :label="schema.label"
              :name="schema.field"
              :rules="schema.required ? [{ required: true, message: `请输入${schema.label}` }] : undefined"
              :wrapper-col="schema.colProps"
            >
              <!-- 根据组件类型动态渲染 -->
              <template v-if="schema.component === 'Input'">
                <Input v-model:value="expenseFormBinding.model[schema.field]" v-bind="schema.componentProps || {}" />
              </template>
              <template v-else-if="schema.component === 'InputNumber'">
                <InputNumber v-model:value="expenseFormBinding.model[schema.field]" v-bind="schema.componentProps || {}" />
              </template>
              <template v-else-if="schema.component === 'Select'">
                <Select 
                  v-model:value="expenseFormBinding.model[schema.field]" 
                  v-bind="schema.componentProps || {}"
                  style="width: 100%"
                >
                  <Select.Option 
                    v-for="option in schema.componentProps?.options" 
                    :key="option.value" 
                    :value="option.value"
                  >
                    {{option.label}}
                  </Select.Option>
                </Select>
              </template>
              <template v-else-if="schema.component === 'DatePicker'">
                <DatePicker v-model:value="expenseFormBinding.model[schema.field]" v-bind="schema.componentProps || {}" style="width: 100%" />
              </template>
            </Form.Item>

            <div class="form-footer">
              <Button type="primary" :loading="loading" @click="handleSubmit">
                提交
              </Button>
              <Button style="margin-left: 8px" @click="resetExpenseFields">
                重置
              </Button>
            </div>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<style scoped>
.form-footer {
  margin-top: 24px;
  text-align: right;
}
</style>
