<template>
  <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg-base)">
    <div class="login-card">
      <!-- Brand -->
      <div style="text-align:center; margin-bottom:32px">
        <div class="brand-logo" style="margin:0 auto 12px; width:52px; height:52px; font-size:22px">A</div>
        <div class="brand-name" style="font-size:28px; letter-spacing:3px">AGON</div>
        <div style="color:var(--text-2); font-size:13px; margin-top:4px">Where Champions Are Made</div>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules">
        <n-form-item path="email" label="Email">
          <n-input v-model:value="form.email" placeholder="admin@agon.app" size="large" />
        </n-form-item>
        <n-form-item path="password" label="Password">
          <n-input v-model:value="form.password" type="password" placeholder="••••••••" size="large" show-password-on="click" />
        </n-form-item>
        <n-button
          type="primary" block size="large"
          :loading="auth.loading"
          @click="handleLogin"
          style="margin-top:8px; height:48px; font-weight:700; font-size:15px"
        >
          Masuk ke AGON
        </n-button>
      </n-form>

      <p style="text-align:center; color:var(--text-3); font-size:12px; margin-top:24px">
        AGON Competition Management System
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth.js'

const auth = useAuthStore()
const router = useRouter()
const message = useMessage()
const formRef = ref(null)

const form = ref({ email: '', password: '' })
const rules = {
  email: [{ required: true, message: 'Email wajib diisi', trigger: 'blur' }],
  password: [{ required: true, message: 'Password wajib diisi', trigger: 'blur' }]
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
    await auth.login(form.value.email, form.value.password)
    router.push({ name: 'Dashboard' })
  } catch (e) {
    if (e?.message) message.error(e.message)
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 40px;
  box-shadow: var(--shadow-md), 0 0 60px rgba(124,107,255,0.08);
}
</style>
