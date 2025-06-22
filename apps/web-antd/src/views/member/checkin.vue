<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Button, Card, Form, Input, message, Descriptions, Avatar } from 'ant-design-vue';
import { UserOutlined } from '@ant-design/icons-vue';

import { getMemberByPhoneApi, memberCheckinApi } from '../../api/modules/members';

interface MemberInfo {
  id: number;
  name: string;
  phone: string;
  status: number;
  expire_date: string;
  membership_type: string;
  avatar?: string;
}

defineOptions({ name: 'MemberCheckin' });

const loading = ref(false);
const searching = ref(false);
const memberInfo = ref<MemberInfo | null>(null);
const showMemberCard = ref(false);

const formData = ref({
  memberPhone: '',
});

// 查找会员信息
async function searchMember() {
  if (!formData.value.memberPhone) {
    message.warning('请输入会员手机号');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(formData.value.memberPhone)) {
    message.error('请输入正确的手机号格式');
    return;
  }

  try {
    searching.value = true;
    const response = await getMemberByPhoneApi(formData.value.memberPhone);
    
    if (response && response.id) {
      memberInfo.value = response;
      showMemberCard.value = true;
    } else {
      message.error('未找到该手机号对应的会员信息');
      memberInfo.value = null;
      showMemberCard.value = false;
    }
  } catch (error: any) {
    console.error('查询会员失败：', error);
    message.error(error.message || '查询会员信息失败');
    memberInfo.value = null;
    showMemberCard.value = false;
  } finally {
    searching.value = false;
  }
}

// 执行签到
async function handleCheckin() {
  if (!memberInfo.value) {
    message.warning('请先查找会员信息');
    return;
  }

  try {
    loading.value = true;
    
    // 检查会员状态
    if (memberInfo.value.status !== 1) {
      message.error('该会员状态异常，无法签到');
      return;
    }

    // 检查会员是否过期
    const now = new Date();
    const expireDate = new Date(memberInfo.value.expire_date);
    if (expireDate < now) {
      message.error('该会员已过期，请续费后再签到');
      return;
    }

    await memberCheckinApi(memberInfo.value.id);
    
    message.success(`${memberInfo.value.name} 签到成功！`);
    
    // 重置表单和状态
    resetForm();
    
  } catch (error: any) {
    console.error('签到失败：', error);
    message.error(error.message || '签到失败，请重试');
  } finally {
    loading.value = false;
  }
}

// 重置表单
function resetForm() {
  formData.value.memberPhone = '';
  memberInfo.value = null;
  showMemberCard.value = false;
}

// 格式化日期
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

// 获取会员状态文本
function getMemberStatusText(status: number) {
  const statusMap: Record<number, { text: string; color: string }> = {
    1: { text: '正常', color: 'green' },
    0: { text: '停用', color: 'red' },
    2: { text: '冻结', color: 'orange' },
  };
  return statusMap[status] || { text: '未知', color: 'gray' };
}

onMounted(() => {
  // 初始化操作
});
</script>

<template>
  <div class="member-checkin">
    <Card title="会员签到" style="margin-bottom: 16px;">
      <Form
        :model="formData"
        layout="inline"
        @finish="searchMember"
      >
        <Form.Item
          label="会员手机号"
          name="memberPhone"
          :rules="[
            { required: true, message: '请输入会员手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
          ]"
        >
          <Input
            v-model:value="formData.memberPhone"
            placeholder="请输入会员手机号"
            :maxlength="11"
            style="width: 200px;"
          />
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            html-type="submit" 
            :loading="searching"
          >
            查找会员
          </Button>
          <Button 
            style="margin-left: 8px;" 
            @click="resetForm"
          >
            重置
          </Button>
        </Form.Item>
      </Form>
    </Card>

    <!-- 会员信息展示卡片 -->
    <Card v-if="showMemberCard && memberInfo" title="会员信息">
      <div style="display: flex; align-items: flex-start; gap: 20px;">
        <Avatar 
          :size="80" 
          :src="memberInfo.avatar"
          :icon="UserOutlined"
        />
        <div style="flex: 1;">
          <Descriptions :column="2" bordered>
            <Descriptions.Item label="姓名">
              {{ memberInfo.name }}
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              {{ memberInfo.phone }}
            </Descriptions.Item>
            <Descriptions.Item label="会员类型">
              {{ memberInfo.membership_type || '普通会员' }}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <span :style="{ color: getMemberStatusText(memberInfo.status).color }">
                {{ getMemberStatusText(memberInfo.status).text }}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="到期时间" :span="2">
              {{ formatDate(memberInfo.expire_date) }}
            </Descriptions.Item>
          </Descriptions>
          
          <div style="margin-top: 16px; text-align: center;">
            <Button 
              type="primary" 
              size="large"
              :loading="loading"
              @click="handleCheckin"
              :disabled="memberInfo.status !== 1"
            >
              确认签到
            </Button>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.member-checkin {
  padding: 16px;
}
</style>
