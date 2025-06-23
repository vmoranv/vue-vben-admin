import { requestClient } from '#/api/request';

// 直接在模块内定义分页参数接口
interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

export namespace MemberApi {
  /** 获取会员列表参数 */
  export interface GetMemberListParams extends PaginationParams {
    name?: string;
    phone?: string;
    membership_type?: string;
    status?: number;
  }

  /** 会员信息 */
  export interface MemberInfo {
    id: number;
    name: string;
    gender: number;
    phone: string;
    birth_date?: string;
    membership_type: string;
    join_date: string;
    expire_date: string;
    status: number;
    remark?: string;
    created_at: string;
    updated_at: string;
  }

  /** 会员列表返回结果 */
  export interface MemberListResult {
    list: MemberInfo[];
    pagination: {
      current: number;
      pageSize: number;
      total: number;
    };
  }

  /** 创建会员参数 */
  export interface CreateMemberParams {
    name: string;
    gender: number;
    phone: string;
    birth_date?: string;
    email?: string;
    address?: string;
    join_date: string;
    expire_date: string;
    membership_type: string;
    coach_id?: null | number;
    remark?: string;
  }

  /** 更新会员参数 */
  export interface UpdateMemberParams extends Partial<CreateMemberParams> {
    birth_date?: string;
    join_date?: string;
    expire_date?: string;
  }

  /** 会员签到参数 */
  export interface CheckInParams {
    member_id: number;
  }
}

/**
 * 获取会员列表
 */
export function getMemberListApi(params: MemberApi.GetMemberListParams) {
  return requestClient.get<MemberApi.MemberListResult>('/members/list', {
    params,
  });
}

/**
 * 创建会员
 */
export function createMemberApi(data: MemberApi.CreateMemberParams) {
  return requestClient.post<MemberApi.MemberInfo>('/members', data);
}

/**
 * 获取会员详情
 */
export function getMemberDetailApi(id: number) {
  return requestClient.get<MemberApi.MemberInfo>(`/members/${id}`);
}

/**
 * 更新会员
 */
export function updateMemberApi(
  id: number,
  data: MemberApi.UpdateMemberParams,
) {
  return requestClient.put<MemberApi.MemberInfo>(`/members/${id}`, data);
}

/**
 * 删除会员
 */
export function deleteMemberApi(id: number) {
  return requestClient.delete<void>(`/members/${id}`);
}

/**
 * 会员签到
 */
export function memberCheckInApi(data: MemberApi.CheckInParams) {
  return requestClient.post<any>('/members/check-in', data);
}

/**
 * 获取会员选项
 */
export async function getMemberOptionsApi() {
  return requestClient.get('/members/options');
}

// 通过手机号查找会员
export function getMemberByPhoneApi(phone: string) {
  return requestClient.get<any>(`/members/phone/${phone}`);
}

// 会员签到
export function memberCheckinApi(memberId: number) {
  return requestClient.post<any>('/members/checkin', { member_id: memberId });
}

// 获取签到记录
export function getCheckinRecordsApi(params: any) {
  return requestClient.get<any>('/members/checkin-records', { params });
}
