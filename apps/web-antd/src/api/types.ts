/**
 * 通用分页参数接口
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

/**
 * 通用分页返回结果
 */
export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
