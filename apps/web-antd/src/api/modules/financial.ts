import { requestClient } from '#/api/request';

// 直接在模块内定义分页参数接口
interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

export namespace FinancialApi {
  /** 获取财务记录列表参数 */
  export interface GetFinancialRecordsParams extends PaginationParams {
    record_type?: string;
    member_id?: number;
    coach_id?: number;
    start_date?: string;
    end_date?: string;
  }

  /** 财务记录信息 */
  export interface FinancialRecordInfo {
    id: number;
    record_type: string;
    amount: number;
    record_date: string;
    member_id?: number;
    member_name?: string;
    coach_id?: number;
    coach_name?: string;
    description?: string;
    payment_method?: string;
    created_at: string;
    updated_at: string;
  }

  /** 财务记录列表返回结果 */
  export interface FinancialRecordListResult {
    list: FinancialRecordInfo[];
    pagination: {
      current: number;
      pageSize: number;
      total: number;
    };
  }

  /** 创建财务记录参数 */
  export interface CreateFinancialRecordParams {
    record_type: string;
    amount: number;
    record_date: string;
    member_id?: number;
    coach_id?: number;
    description?: string;
    payment_method?: string;
  }

  /** 财务统计列表项类型 */
  export interface FinancialStatsItem {
    time_period: string;
    membership_income: number;
    coaching_income: number;
    other_income: number;
    expense: number;
    profit: number;
  }

  /** 财务统计总计类型 */
  export interface FinancialStatsTotal {
    total_membership_income: number;
    total_coaching_income: number;
    total_other_income: number;
    total_expense: number;
    total_profit: number;
  }

  /** 财务统计结果类型 */
  export interface FinancialStatsResult {
    list: FinancialStatsItem[];
    total: FinancialStatsTotal;
    time_format: string;
  }

  /** 获取财务统计参数类型 */
  export interface GetFinancialStatsParams {
    start_date?: string;
    end_date?: string;
    time_unit?: 'day' | 'week' | 'month';
  }
}

/**
 * 获取财务记录列表
 */
export function getFinancialRecordsApi(
  params: FinancialApi.GetFinancialRecordsParams,
) {
  return requestClient.get<FinancialApi.FinancialRecordListResult>(
    '/financial/records',
    { params },
  );
}

/**
 * 创建财务记录
 */
export function createFinancialRecordApi(
  data: FinancialApi.CreateFinancialRecordParams,
) {
  return requestClient.post<FinancialApi.FinancialRecordInfo>(
    '/financial/records',
    data,
  );
}

/**
 * 获取财务记录详情
 */
export async function getFinancialRecordDetailApi(id: number) {
  return requestClient.get<{
    code: number;
    message: string;
    data: FinancialApi.FinancialRecordInfo;
  }>(`/financial/records/${id}`);
}

/**
 * 删除财务记录
 */
export function deleteFinancialRecordApi(id: number) {
  return requestClient.delete<void>(`/financial/records/${id}`);
}

/**
 * 获取财务统计
 */
export function getFinancialStatsApi(
  params: FinancialApi.GetFinancialStatsParams,
) {
  return requestClient.get<FinancialApi.FinancialStatsResult>(
    '/financial/statistics',
    { params },
  );
}

/**
 * 更新财务记录
 */
export async function updateFinancialRecordApi(id: number, data: {
  record_type: string;
  amount: number;
  record_date: string;
  payment_method?: string;
  description?: string;
  member_id?: number | null;
  coach_id?: number | null;
}) {
  return requestClient.put<{
    code: number;
    message: string;
    data: FinancialApi.FinancialRecordInfo;
  }>(`/financial/records/${id}`, data);
}
