import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    try {
      loginLoading.value = true;

      // 登录请求
      const loginResult = await loginApi(params);

      // 成功获取 token
      if (loginResult?.accessToken) {
        // 验证令牌格式和有效期
        try {
          const tokenParts = loginResult.accessToken.split('.');
          if (tokenParts.length === 3 && tokenParts[1]) {
            const payload = JSON.parse(
              atob(tokenParts[1].replaceAll('-', '+').replaceAll('_', '/')),
            );
            const currentTime = Math.floor(Date.now() / 1000);

            if (currentTime > payload.exp) {
              console.error('❌ 警告：获取的令牌已经过期！');
            }
          } else {
            console.error('❌ JWT令牌格式无效');
          }
        } catch (parseError) {
          console.error('❌ 令牌格式验证失败:', parseError);
        }

        accessStore.setAccessToken(loginResult.accessToken);

        // 获取用户信息
        const userResult = await getUserInfoApi();

        if (userResult) {
          userStore.setUserInfo(userResult);

          // 获取权限码
          const accessCodes = await getAccessCodesApi();
          accessStore.setAccessCodes(accessCodes || []);

          // 获取重定向路径
          const currentRoute = router.currentRoute.value;
          const redirectPath = currentRoute.query.redirect
            ? decodeURIComponent(currentRoute.query.redirect as string)
            : userResult?.homePath ||
              preferences.app.defaultHomePath ||
              '/analytics';
          await router.replace(redirectPath);
          if (onSuccess) {
            await onSuccess();
          }
        }
      } else {
        console.error('❌ 登录响应中没有accessToken');
      }
    } catch (error) {
      console.error('💥 登录过程中发生错误:');
      console.error('  - 错误类型:', error?.constructor?.name);
      console.error('  - 完整错误对象:', error);

      notification.error({
        message: $t('sys.login.loginError'),
        description: (error as any)?.message || $t('sys.login.networkError'),
      });
    } finally {
      loginLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {}
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
