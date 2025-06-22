import { requestClient } from '#/api/request';

// 分页参数接口
interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

// 添加标准API响应类型定义
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export namespace StaffApi {
  /** 获取人员列表参数 */
  export interface GetStaffListParams extends PaginationParams {
    name?: string;
    role?: string;
    status?: string;
  }

  /** 人员信息 */
  export interface StaffInfo {
    id: number;
    name: string;
    username: string;
    role: string;
    phone: string;
    email: string;
    status: string;
    avatar: string;
    created_at: string;
    updated_at: string;
  }

  /** 人员列表返回结果 */
  export interface StaffListResult {
    list: StaffInfo[];
    pagination: {
      current: number;
      pageSize: number;
      total: number;
    };
  }

  /** 创建人员参数 */
  export interface CreateStaffParams {
    name: string;
    username: string;
    password: string;
    role: string;
    phone?: string;
    email?: string;
    status?: string;
    avatar?: string;
  }

  /** 更新人员参数 */
  export interface UpdateStaffParams extends Partial<CreateStaffParams> {
    id: number;
    password?: string;
  }
}

// API函数
export const getStaffListApi = async (params: StaffApi.GetStaffListParams) => {
  return requestClient.get<StaffApi.StaffListResult>('/staff', { params });
};

// 修改 API 函数返回类型定义
export function getStaffDetailApi(id: number) {
  return requestClient.get<StaffApi.StaffInfo>(`/staff/${id}`);
}

export const createStaffApi = async (data: StaffApi.CreateStaffParams) => {
  return requestClient.post('/staff', data);
};

export const updateStaffApi = async (data: StaffApi.UpdateStaffParams) => {
  return requestClient.put(`/staff/${data.id}`, data);
};

export const deleteStaffApi = async (id: number) => {
  return requestClient.delete(`/staff/${id}`);
};
