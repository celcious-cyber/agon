<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <n-loading-bar-provider>
            <router-view />
          </n-loading-bar-provider>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { 
  darkTheme, 
  NConfigProvider, 
  NMessageProvider, 
  NNotificationProvider, 
  NDialogProvider, 
  NLoadingBarProvider 
} from 'naive-ui'

const themeOverrides = {
  common: {
    primaryColor: '#7C6BFF',
    primaryColorHover: '#9589FF',
    primaryColorPressed: '#6355E8',
    primaryColorSuppl: '#9589FF',
    borderRadius: '8px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    bodyColor: '#0A0C10',
    cardColor: '#13161E',
    modalColor: '#13161E',
    popoverColor: '#1C2030',
    tableColor: '#13161E',
    tableColorHover: '#1C2030',
    tableHeaderColor: '#161A23',
    inputColor: '#1C2030',
    inputColorDisabled: '#161A23',
  },
  Button: {
    borderRadius: '8px',
  },
  Card: {
    borderRadius: '12px',
    color: '#13161E',
    borderColor: '#252D40',
  },
  DataTable: {
    borderRadius: '12px',
    thColor: '#161A23',
    tdColor: '#13161E',
    tdColorHover: '#1C2030',
  },
  Modal: {
    borderRadius: '16px',
    color: '#13161E',
  }
}
</script>
