<script lang="ts" setup>
import type { MemberApi } from '../../api/modules/members';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Button, Card, Descriptions, message } from 'ant-design-vue';

import { getMemberDetailApi } from '../../api/modules/members';

defineOptions({ name: 'MemberDetails' });

const router = useRouter();
const route = useRoute();
const memberId = Number(route.params.id);
const loading = ref(false);
const memberInfo = ref<MemberApi.MemberInfo | null>(null);

async function getMemberDetail() {
  try {
    loading.value = true;
    const res = await getMemberDetailApi(memberId);
    memberInfo.value = res;
  } catch (error) {
    console.error('获取会员详情失败', error);
    message.error('获取会员详情失败');
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/member/list');
}

onMounted(() => {
  getMemberDetail();
});
</script>

<template>
  <div>
    <Card :loading="loading">
      <template #title>会员详情</template>
      <template #extra>
        <Button @click="goBack">返回</Button>
      </template>
      <Descriptions bordered>
        <Descriptions.Item label="ID">{{ memberInfo?.id }}</Descriptions.Item>
        <Descriptions.Item label="姓名">
          {{ memberInfo?.name }}
        </Descriptions.Item>
        <Descriptions.Item label="性别">
          {{ Number(memberInfo?.gender) === 1 ? '男' : '女' }}
        </Descriptions.Item>
        <Descriptions.Item label="手机号">
          {{ memberInfo?.phone }}
        </Descriptions.Item>
        <Descriptions.Item label="会员类型">
          {{ memberInfo?.membership_type }}
        </Descriptions.Item>
        <Descriptions.Item label="入会日期">
          {{ memberInfo?.join_date }}
        </Descriptions.Item>
        <Descriptions.Item label="到期日期">
          {{ memberInfo?.expire_date }}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {{ memberInfo?.status === 1 ? '有效' : '过期' }}
        </Descriptions.Item>
        <Descriptions.Item label="生日">
          {{ memberInfo?.birth_date }}
        </Descriptions.Item>
        <Descriptions.Item label="备注">
          {{ memberInfo?.remark }}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {{ memberInfo?.created_at }}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {{ memberInfo?.updated_at }}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  </div>
</template>
