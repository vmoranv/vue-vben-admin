<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import type { ECharts, EChartsOption } from 'echarts';

import type { FinancialApi } from '../../api/modules/financial';

import { onMounted, reactive, ref } from 'vue';

import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Select,
  Statistic,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts';

import { $t } from '#/locales';

import { getFinancialStatsApi } from '../../api/modules/financial';

defineOptions({ name: 'FinancialStats' });

const loading = ref(false);
const statsData = ref<FinancialApi.FinancialStatsResult | null>(null);
const chartRef = ref<HTMLElement | null>(null);
const chart = ref<ECharts | null>(null);

// 查询参数
const queryParams = reactive({
  start_date: undefined as Dayjs | string | undefined,
  end_date: undefined as Dayjs | string | undefined,
  time_unit: 'day' as 'day' | 'month' | 'week',
});

// 定义图表数据类型
interface ChartDataItem {
  time_period: string;
  income: number;
  expense: number;
  profit: number;
}

// 定义表格数据类型
interface TableDataItem {
  key: string;
  date: string;
  income: number;
  expense: number;
  profit: number;
}

const chartData = ref<ChartDataItem[]>([]);
const tableData = ref<TableDataItem[]>([]);

async function handleSearch() {
  try {
    loading.value = true;
    const params: FinancialApi.GetFinancialStatsParams = {
      start_date: queryParams.start_date
        ? dayjs(queryParams.start_date).format('YYYY-MM-DD')
        : '',
      end_date: queryParams.end_date
        ? dayjs(queryParams.end_date).format('YYYY-MM-DD')
        : '',
      time_unit: queryParams.time_unit,
    };

    const res = await getFinancialStatsApi(params);
    if (res && res.list) {
      statsData.value = {
        ...res,
        time_format: res.time_format || 'YYYY-MM-DD',
      };
      
      chartData.value = res.list.map((item: FinancialApi.FinancialStatsItem) => ({
        time_period: item.time_period,
        income: Number(item.membership_income || 0) + Number(item.coaching_income || 0) + Number(item.other_income || 0),
        expense: Number(item.expense || 0),
        profit: Number(item.profit || 0),
      }));
      renderChart();

      tableData.value = res.list.map((item: FinancialApi.FinancialStatsItem, index: number) => ({
        key: `${index}`,
        date: item.time_period,
        income: Number(item.membership_income || 0) + Number(item.coaching_income || 0) + Number(item.other_income || 0),
        expense: Number(item.expense || 0),
        profit: Number(item.profit || 0),
      }));
    }
  } catch (error) {
    console.error('获取财务统计数据失败:', error);
    statsData.value = null;
    chartData.value = [];
    tableData.value = [];
  } finally {
    loading.value = false;
  }
}

function renderChart() {
  if (!chartRef.value || !chartData.value || chartData.value.length === 0) {
    return;
  }

  if (chart.value) {
    chart.value.dispose();
  }

  chart.value = echarts.init(chartRef.value);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        if (Array.isArray(params)) {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            result += `${param.marker}${param.seriesName}: ￥${(param.value || 0).toFixed(2)}<br/>`;
          });
          return result;
        }
        return '';
      },
    },
    legend: {
      data: [
        $t('page.financial.income'),
        $t('page.financial.expense'),
        $t('page.financial.profit'),
      ],
    },
    xAxis: {
      type: 'category',
      data: chartData.value.map((item) => item.time_period || ''),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `￥${value.toFixed(0)}`,
      },
    },
    series: [
      {
        name: $t('page.financial.income'),
        type: 'bar',
        stack: 'total',
        data: chartData.value.map((item) => Number(item.income) || 0),
        itemStyle: {
          color: '#3f8600',
        },
      },
      {
        name: $t('page.financial.expense'),
        type: 'bar',
        stack: 'total',
        data: chartData.value.map((item) => Number(item.expense) || 0),
        itemStyle: {
          color: '#cf1322',
        },
      },
      {
        name: $t('page.financial.profit'),
        type: 'line',
        data: chartData.value.map((item) => Number(item.profit) || 0),
        itemStyle: {
          color: '#1677ff',
        },
      },
    ],
  };

  chart.value.setOption(option);

  const resizeHandler = () => {
    chart.value?.resize();
  };
  
  window.removeEventListener('resize', resizeHandler);
  window.addEventListener('resize', resizeHandler);
}

onMounted(() => {
  handleSearch();
});

const columns: TableColumnsType = [
  {
    title: $t('page.financial.date'),
    dataIndex: 'date',
    key: 'date',
    width: 120,
  },
  {
    title: $t('page.financial.income'),
    dataIndex: 'income',
    key: 'income',
    align: 'right' as const,
    customRender: ({ text }: { text: number | string }) => `￥${Number(text || 0).toFixed(2)}`,
  },
  {
    title: $t('page.financial.expense'),
    dataIndex: 'expense',
    key: 'expense',
    align: 'right' as const,
    customRender: ({ text }: { text: number | string }) => `￥${Number(text || 0).toFixed(2)}`,
  },
  {
    title: $t('page.financial.profit'),
    dataIndex: 'profit',
    key: 'profit',
    align: 'right' as const,
    customRender: ({ text }: { text: number | string }) => `￥${Number(text || 0).toFixed(2)}`,
  },
];
</script>

<template>
  <div class="p-4">
    <Card class="mb-4">
      <Form layout="horizontal" :model="queryParams">
        <div class="grid grid-cols-3 gap-4">
          <Form.Item :label="$t('page.financial.startDate')">
            <DatePicker
              v-model:value="queryParams.start_date"
              format="YYYY-MM-DD"
              :placeholder="$t('page.financial.startDatePlaceholder')"
              style="width: 100%"
            />
          </Form.Item>
          <Form.Item :label="$t('page.financial.endDate')">
            <DatePicker
              v-model:value="queryParams.end_date"
              format="YYYY-MM-DD"
              :placeholder="$t('page.financial.endDatePlaceholder')"
              style="width: 100%"
            />
          </Form.Item>
          <Form.Item :label="$t('page.financial.granularity')">
            <Select v-model:value="queryParams.time_unit" style="width: 100%">
              <Select.Option value="day">
                {{ $t('page.financial.daily') }}
              </Select.Option>
              <Select.Option value="week">
                {{ $t('page.financial.weekly') }}
              </Select.Option>
              <Select.Option value="month">
                {{ $t('page.financial.monthly') }}
              </Select.Option>
              <!-- 已移除"年"选项，因为API不支持 -->
            </Select>
          </Form.Item>
        </div>
        <Form.Item>
          <Button type="primary" @click="handleSearch">
            {{ $t('common.search') }}
          </Button>
        </Form.Item>
      </Form>
    </Card>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <Card>
        <Statistic
          :title="$t('page.financial.totalIncome')"
          :value="statsData?.total ? 
            (Number(statsData.total.total_membership_income || 0) + 
             Number(statsData.total.total_coaching_income || 0) + 
             Number(statsData.total.total_other_income || 0)) : 0"
          :precision="2"
          :value-style="{ color: '#3f8600' }"
          prefix="￥"
        >
          <template #suffix>
            <ArrowUpOutlined />
          </template>
        </Statistic>
      </Card>
      
      <Card>
        <Statistic
          :title="$t('page.financial.totalExpense')"
          :value="Number(statsData?.total?.total_expense || 0)"
          :precision="2"
          :value-style="{ color: '#cf1322' }"
          prefix="￥"
        >
          <template #suffix>
            <ArrowDownOutlined />
          </template>
        </Statistic>
      </Card>
      
      <Card>
        <Statistic
          :title="$t('page.financial.totalProfit')"
          :value="Number(statsData?.total?.total_profit || 0)"
          :precision="2"
          :value-style="{ 
            color: (Number(statsData?.total?.total_profit || 0)) >= 0 ? '#3f8600' : '#cf1322' 
          }"
          prefix="￥"
        >
          <template #suffix>
            <component 
              :is="(Number(statsData?.total?.total_profit || 0)) >= 0 ? ArrowUpOutlined : ArrowDownOutlined" 
            />
          </template>
        </Statistic>
      </Card>
      
      <Card>
        <Statistic
          :title="$t('page.financial.profitMargin')"
          :value="statsData?.total ? 
            ((Number(statsData.total.total_membership_income || 0) + 
              Number(statsData.total.total_coaching_income || 0) + 
              Number(statsData.total.total_other_income || 0)) > 0 ? 
             (Number(statsData.total.total_profit || 0) / 
              (Number(statsData.total.total_membership_income || 0) + 
               Number(statsData.total.total_coaching_income || 0) + 
               Number(statsData.total.total_other_income || 0)) * 100) : 0) : 0"
          :precision="1"
          suffix="%"
          :value-style="{ 
            color: (Number(statsData?.total?.total_profit || 0)) >= 0 ? '#3f8600' : '#cf1322' 
          }"
        />
      </Card>
    </div>

    <Card class="mb-4">
      <div ref="chartRef" style="width: 100%; height: 400px"></div>
    </Card>

    <Card title="财务明细">
      <Table :columns="columns" :data-source="tableData" :loading="loading" />
    </Card>
  </div>
</template>

<style scoped>
.financial-stats-page {
  padding: 16px;
}

.statistics-cards {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 24px;
}

.statistic-card {
  flex: 1;
}

.chart-container {
  height: 400px;
  margin-top: 24px;
}
</style>
