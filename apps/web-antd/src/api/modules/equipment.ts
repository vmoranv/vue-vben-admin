import { requestClient } from '#/api/request';

// 直接在模块内定义分页参数接口
interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

export namespace EquipmentApi {
  /** 获取设备列表参数 */
  export interface GetEquipmentListParams extends PaginationParams {
    name?: string;
    type?: string;
    status?: number;
  }

  /** 设备信息 */
  export interface EquipmentInfo {
    id: number;
    name: string;
    type: string;
    status: number;
    purchaseDate: string;
    price: number;
    model?: string;
    location?: string;
    remark?: string;
    createdAt: string;
    updatedAt: string;
    warrantyExpire?: string;
  }

  /** 设备列表返回结果 */
  export interface EquipmentListResult {
    list: EquipmentInfo[];
    pagination: {
      current: number;
      pageSize: number;
      total: number;
    };
  }

  /** 创建设备参数 */
  export interface CreateEquipmentParams {
    name: string;
    type: string;
    status: number;
    purchaseDate: string;
    price: number;
    model?: string;
    location?: string;
    remark?: string;
    warrantyExpire?: string;
  }

  /** 更新设备参数 */
  export interface UpdateEquipmentParams
    extends Partial<CreateEquipmentParams> {}

  /** 维护记录参数 */
  export interface MaintenanceRecordParams {
    equipment_id: number;
    maintenance_type: string;
    maintenance_date: string | any;
    cost: number;
    description: string;
  }
}

/**
 * 获取设备列表
 * @param params 查询参数
 * @returns 设备列表数据
 */
export function getEquipmentListApi(params: EquipmentApi.GetEquipmentListParams) {
  return requestClient.get<EquipmentApi.EquipmentListResult>('/equipment/list', { params });
}

/**
 * 获取设备详情
 * @param id 设备ID
 * @returns 设备详情
 */
export function getEquipmentDetailApi(id: number) {
  return requestClient.get<EquipmentApi.EquipmentInfo>(`/equipment/detail/${id}`);
}

/**
 * 创建设备
 * @param params 设备参数
 * @returns 创建结果
 */
export function createEquipmentApi(params: EquipmentApi.CreateEquipmentParams) {
  return requestClient.post('/equipment/create', params);
}

/**
 * 更新设备
 * @param id 设备ID
 * @param params 设备参数
 * @returns 更新结果
 */
export function updateEquipmentApi(id: number, params: EquipmentApi.UpdateEquipmentParams) {
  return requestClient.put(`/equipment/${id}`, params);
}

/**
 * 删除设备
 * @param id 设备ID
 * @returns 删除结果
 */
export function deleteEquipmentApi(id: number) {
  return requestClient.delete(`/equipment/${id}`);
}

/**
 * 获取维护记录
 * @param id 设备ID
 * @param params 分页参数
 * @returns 维护记录列表
 */
export function getMaintenanceRecordsApi(id: number, params?: PaginationParams) {
  return requestClient.get(`/equipment/maintenance/${id}`, { params });
}

/**
 * 添加维护记录
 * @param params 维护记录参数
 * @returns 添加结果
 */
export function addMaintenanceRecordApi(params: EquipmentApi.MaintenanceRecordParams) {
  return requestClient.post('/equipment/maintenance', params);
}
