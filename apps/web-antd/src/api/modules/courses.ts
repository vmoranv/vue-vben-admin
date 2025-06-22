import { requestClient } from '#/api/request';

// 直接在模块内定义分页参数接口
interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

export interface CourseInfo {
  id: number;
  name: string;
  coach_id: number;
  coach_name?: string;
  coach?: { realName: string };
  course_type: string;
  start_time: string;
  end_time: string;
  capacity: number;
  current_participants: number;
  location?: string;
  price: number;
  remark?: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface CourseBookingInfo {
  id: number;
  member_id: number;
  course_id: number;
  course_name?: string;
  member_name?: string;
  member_phone?: string;
  course_time?: string;
  status: number;
  created_at: string;
}

// 获取课程列表参数接口
export interface CourseListParams extends PaginationParams {
  name?: string;
  coach_id?: number;
  course_type?: string;
  status?: number;
  start_date?: string;
  end_date?: string;
}

// 获取课程列表
export async function getCourseListApi(params: CourseListParams) {
  return requestClient.get('/courses/list', { params });
}

// 获取课程详情
export async function getCourseDetailApi(
  id: number,
): Promise<{ code: number; message: string; data: CourseInfo }> {
  return requestClient.get(`/courses/${id}`);
}

// 创建课程
export async function createCourseApi(data: Partial<CourseInfo>) {
  return requestClient.post('/courses', data);
}

// 更新课程
export async function updateCourseApi(id: number, data: Partial<CourseInfo>) {
  return requestClient.put(`/courses/${id}`, data);
}

// 取消课程
export async function cancelCourseApi(id: number) {
  return requestClient.put(`/courses/${id}/cancel`);
}

// 删除课程
export async function deleteCourseApi(id: number) {
  return requestClient.delete(`/courses/${id}`);
}

// 课程预约参数接口
export interface CourseBookingParams extends PaginationParams {
  member_id?: number;
  course_id?: number;
  status?: number;
}

// 获取课程预约列表
export async function getCourseBookingsApi(params: CourseBookingParams) {
  return requestClient.get('/courses/bookings', { params });
}

// 预约课程
export async function bookCourseApi(data: {
  course_id: number;
  member_id: number;
}) {
  return requestClient.post('/courses/book', data);
}

// 取消预约
export async function cancelBookingApi(id: number) {
  return requestClient.post('/courses/cancel-booking', { id });
}

// 获取教练列表
export async function getCoachesApi(): Promise<any[]> {
  return requestClient.get('/courses/coaches');
}
