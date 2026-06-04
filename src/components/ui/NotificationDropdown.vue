<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

type NotificationType = 'reeval' | 'expiry' | 'opinion' | 'report'

interface Notification {
  id: number
  type: NotificationType
  title: string
  body: string
  time: string
  read: boolean
}

const MOCK: Notification[] = [
  {
    id: 1,
    type: 'reeval',
    title: '재평가 요청 도착',
    body: '머신러닝 기반 웨이퍼 불량 검출 시스템에 대한 검토 의견 제출을 요청합니다.',
    time: '방금 전',
    read: false,
  },
  {
    id: 2,
    type: 'expiry',
    title: '특허 만료 임박',
    body: '5G 기반 실시간 데이터 압축 알고리즘 특허가 30일 후 만료됩니다.',
    time: '1시간 전',
    read: false,
  },
  {
    id: 3,
    type: 'opinion',
    title: '검토 의견 제출 완료',
    body: '자율주행 장애물 회피 경로 계획 기술에 대한 유지 의견이 제출되었습니다.',
    time: '어제',
    read: false,
  },
  {
    id: 4,
    type: 'report',
    title: 'AI 평가 보고서 생성 완료',
    body: '영상 인식 기반 보안 솔루션 특허의 AI 평가 보고서가 준비되었습니다.',
    time: '2일 전',
    read: true,
  },
  {
    id: 5,
    type: 'reeval',
    title: '재평가 기한 초과',
    body: '반도체 공정 최적화 시스템에 대한 검토 기한이 초과되었습니다.',
    time: '3일 전',
    read: true,
  },
]

const open          = ref(false)
const wrapperEl     = ref<HTMLElement | null>(null)
const notifications = ref<Notification[]>(MOCK)

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function toggle() { open.value = !open.value }

function markAllRead() {
  notifications.value.forEach(n => { n.read = true })
}

function markRead(id: number) {
  const n = notifications.value.find(n => n.id === id)
  if (n) n.read = true
}

function handleClickOutside(e: MouseEvent) {
  if (wrapperEl.value && !wrapperEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="wrapperEl" class="notif-wrapper">

    <!-- 벨 버튼 -->
    <button
      class="topbar__icon-btn"
      :class="{ 'topbar__icon-btn--active': open }"
      aria-label="알림"
      @click="toggle"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <!-- 드롭다운 패널 -->
    <Transition name="notif-drop">
      <div v-if="open" class="notif-panel">

        <div class="notif-panel__header">
          <span class="notif-panel__title">알림</span>
          <button v-if="unreadCount > 0" class="notif-mark-all" @click="markAllRead">모두 읽음</button>
        </div>

        <ul class="notif-list">
          <li
            v-for="n in notifications"
            :key="n.id"
            class="notif-item"
            :class="{ 'notif-item--unread': !n.read }"
            @click="markRead(n.id)"
          >
            <span class="notif-icon" :class="`notif-icon--${n.type}`">
              <!-- reeval -->
              <svg v-if="n.type === 'reeval'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <!-- expiry -->
              <svg v-else-if="n.type === 'expiry'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <!-- opinion -->
              <svg v-else-if="n.type === 'opinion'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <!-- report -->
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </span>

            <div class="notif-content">
              <p class="notif-content__title">{{ n.title }}</p>
              <p class="notif-content__body">{{ n.body }}</p>
              <p class="notif-content__time">{{ n.time }}</p>
            </div>

            <span v-if="!n.read" class="notif-unread-dot" />
          </li>
        </ul>

        <div v-if="notifications.length === 0" class="notif-empty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p>새 알림이 없습니다.</p>
        </div>

      </div>
    </Transition>

  </div>
</template>

<style scoped>
.notif-wrapper {
  position: relative;
}

/* 벨 버튼은 레이아웃의 .topbar__icon-btn 클래스와 동일하게 맞춤 */
.topbar__icon-btn {
  position: relative;
  width: 36px; height: 36px;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.topbar__icon-btn:hover { background: #f1f5f9; color: #0f172a; }
.topbar__icon-btn--active { background: #f1f5f9; border-color: #cbd5e1; color: #0f172a; }

/* 뱃지 */
.notif-badge {
  position: absolute;
  top: -5px; right: -5px;
  min-width: 16px; height: 16px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 1.5px solid #fff;
  pointer-events: none;
}

/* 드롭다운 패널 */
.notif-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06);
  z-index: 100;
  overflow: hidden;
}

.notif-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.notif-panel__title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.notif-mark-all {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  font-family: inherit;
  padding: 0;
  transition: color 0.13s;
}
.notif-mark-all:hover { color: #4f46e5; }

/* 알림 리스트 */
.notif-list {
  list-style: none;
  margin: 0;
  padding: 6px 0;
  max-height: 400px;
  overflow-y: auto;
}
.notif-list::-webkit-scrollbar { width: 4px; }
.notif-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

/* 알림 아이템 */
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 18px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid #f8fafc;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: #f8fafc; }
.notif-item--unread { background: #fafbff; }
.notif-item--unread:hover { background: #f4f5ff; }

/* 타입 아이콘 */
.notif-icon {
  flex-shrink: 0;
  width: 32px; height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}
.notif-icon--reeval  { background: #eef2ff; color: #6366f1; }
.notif-icon--expiry  { background: #fffbeb; color: #d97706; }
.notif-icon--opinion { background: #f0fdf4; color: #16a34a; }
.notif-icon--report  { background: #eff6ff; color: #3b82f6; }

/* 내용 */
.notif-content { flex: 1; min-width: 0; }
.notif-content__title {
  font-size: 13px; font-weight: 700; color: #0f172a;
  margin: 0 0 3px;
}
.notif-content__body {
  font-size: 12.5px; color: #475569; line-height: 1.5;
  margin: 0 0 5px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.notif-content__time {
  font-size: 11.5px; color: #94a3b8; margin: 0;
}

/* 읽지 않음 점 */
.notif-unread-dot {
  flex-shrink: 0;
  width: 7px; height: 7px;
  background: #6366f1;
  border-radius: 50%;
  margin-top: 5px;
}

/* 빈 상태 */
.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
  color: #94a3b8;
}
.notif-empty p { font-size: 13.5px; font-weight: 500; margin: 0; }

/* 드롭 애니메이션 */
.notif-drop-enter-active { transition: opacity 0.18s, transform 0.18s; }
.notif-drop-leave-active { transition: opacity 0.12s, transform 0.12s; }
.notif-drop-enter-from  { opacity: 0; transform: translateY(-6px) scale(0.98); }
.notif-drop-leave-to    { opacity: 0; transform: translateY(-4px) scale(0.98); }
</style>
