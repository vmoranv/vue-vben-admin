/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('🚨 触发重新认证逻辑');
    console.warn(
      '  - 原因: Access token or refresh token is invalid or expired',
    );

    const accessStore = useAccessStore();
    const authStore = useAuthStore();

    console.warn('  - 当前令牌状态:', {
      hasToken: !!accessStore.accessToken,
      tokenLength: accessStore.accessToken?.length || 0,
      isAccessChecked: accessStore.isAccessChecked,
      loginExpiredMode: preferences.app.loginExpiredMode,
    });

    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      console.warn('  - 设置登录过期模态框');
      accessStore.setLoginExpired(true);
    } else {
      console.warn('  - 执行登出操作');
      await authStore.logout();
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      const formattedToken = formatToken(accessStore.accessToken);
      config.headers.Authorization = formattedToken;
      config.headers['Accept-Language'] = preferences.app.locale;

      return config;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 添加详细的错误调试信息
      console.error('❌ 请求错误详情:');
      console.error('  - 错误消息:', msg);
      console.error('  - 响应状态:', error?.response?.status);
      console.error('  - 响应数据:', error?.response?.data);
      console.error('  - 请求URL:', error?.config?.url);
      console.error('  - 请求方法:', error?.config?.method);

      // 如果是用户信息接口的401错误，提供更详细的分析
      if (
        error?.response?.status === 401 &&
        error?.config?.url?.includes('/auth/user/info')
      ) {
        console.error('🔐 用户信息接口认证失败分析:');
        console.error(
          '  - 请求头Authorization:',
          error?.config?.headers?.Authorization,
        );
        console.error('  - 后端返回消息:', error?.response?.data?.message);
        console.error('  - 建议检查后端JWT验证逻辑');

        // 提取JWT信息用于调试
        const authHeader = error?.config?.headers?.Authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7);
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(
                atob(tokenParts[1].replaceAll('-', '+').replaceAll('_', '/')),
              );
              console.error('  - JWT载荷信息:', payload);
            }
          } catch (parseError) {
            console.error('  - JWT解析错误:', parseError);
          }
        }
      }

      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.message ?? '';

      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
