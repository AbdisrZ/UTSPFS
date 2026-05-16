/* =============================================
   SMART TASK MANAGER — Shared Logic
   js/app.js
   ============================================= */

// === STORAGE KEY ===
const STORAGE_KEY = 'stm_tasks';

// Urutan prioritas untuk sorting
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// =============================================
// CRUD OPERATIONS
// =============================================

function getTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function addTask(data) {
  const tasks = getTasks();
  const task = {
    id: Date.now().toString(),
    title: data.title.trim(),
    description: data.description ? data.description.trim() : '',
    deadline: data.deadline,
    priority: data.priority,
    completed: false,
    createdAt: Date.now()
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

function updateTask(id, updates) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  saveTasks(tasks);
  return tasks[idx];
}

function deleteTask(id) {
  saveTasks(getTasks().filter(t => t.id !== id));
}

function getTask(id) {
  return getTasks().find(t => t.id === id) || null;
}

// =============================================
// SORTING — sesuai spesifikasi:
// 1. Urutkan berdasarkan deadline (terdekat dulu)
// 2. Jika sama, urutkan berdasarkan prioritas (high > medium > low)
// =============================================

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const dateA = new Date(a.deadline + 'T00:00:00');
    const dateB = new Date(b.deadline + 'T00:00:00');
    const dateDiff = dateA - dateB;
    if (dateDiff !== 0) return dateDiff;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

// =============================================
// KALKULASI WARNA DEADLINE
// =============================================

function getDeadlineDays(deadline) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline + 'T00:00:00');
  return Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
}

// Mengembalikan class CSS: 'urgent' | 'soon' | 'normal'
function getDeadlineClass(deadline) {
  if (!deadline) return 'normal';
  const days = getDeadlineDays(deadline);
  if (days <= 1) return 'urgent';
  if (days <= 3) return 'soon';
  return 'normal';
}

// =============================================
// FORMAT TANGGAL (bahasa Indonesia)
// =============================================

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

function formatDateLong(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

function formatTimestamp(ts) {
  if (!ts) return '-';
  const date = new Date(ts);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// =============================================
// ESCAPE HTML untuk keamanan
// =============================================

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =============================================
// BUILD HTML TASK CARD
// =============================================

function buildTaskCard(task, index = 0) {
  const deadlineClass = getDeadlineClass(task.deadline);
  const priorityLabels = { high: 'High', medium: 'Medium', low: 'Low' };

  // SVG ikon kalender inline
  const calendarSvg = `<svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
  </svg>`;

  // SVG ikon 3 titik (more_vert)
  const moreSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>`;

  return `
    <div class="swipe-wrapper" data-id="${task.id}">
      <div class="swipe-action" onclick="handleSwipeComplete('${task.id}')" aria-label="Tandai selesai">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      </div>
      <div class="task-card ${task.completed ? 'completed' : ''} deadline-${deadlineClass}"
           style="animation-delay:${index * 0.05}s"
           onclick="goToDetail('${task.id}')">
        <div class="card-priority-bar"></div>
        <div class="card-content">
          <div class="card-header">
            <span class="card-title">${escapeHtml(task.title)}</span>
            <div class="card-menu-container" onclick="event.stopPropagation()">
              <button class="card-menu-btn"
                      aria-label="Opsi tugas ${escapeHtml(task.title)}"
                      onclick="toggleCardMenu('${task.id}')">
                ${moreSvg}
              </button>
              <div class="card-dropdown" id="menu-${task.id}" role="menu">
                <button onclick="editTask('${task.id}')" role="menuitem">Edit</button>
                <button class="delete-btn" onclick="confirmDeleteTask('${task.id}')" role="menuitem">Hapus</button>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <span class="card-deadline-text">
              ${calendarSvg}
              ${formatDate(task.deadline)}
            </span>
            <span class="priority-badge priority-${task.priority}">
              ${priorityLabels[task.priority]}
            </span>
          </div>
        </div>
      </div>
    </div>`;
}

// =============================================
// INTERAKSI CARD MENU
// =============================================

function toggleCardMenu(taskId) {
  // Tutup semua dropdown lain
  document.querySelectorAll('.card-dropdown.open').forEach(d => {
    if (d.id !== `menu-${taskId}`) d.classList.remove('open');
  });
  const menu = document.getElementById(`menu-${taskId}`);
  if (menu) menu.classList.toggle('open');
}

// Tutup dropdown jika klik di luar
document.addEventListener('click', (e) => {
  if (!e.target.closest('.card-menu-container')) {
    document.querySelectorAll('.card-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// =============================================
// NAVIGASI
// =============================================

function goToDetail(taskId) {
  window.location.href = `detail.html?id=${taskId}`;
}

function editTask(taskId) {
  window.location.href = `add-task.html?id=${taskId}`;
}

// =============================================
// TOGGLE COMPLETE via SWIPE
// =============================================

function handleSwipeComplete(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  updateTask(taskId, { completed: !task.completed });

  // Reset posisi swipe dan perbarui tampilan
  const wrapper = document.querySelector(`.swipe-wrapper[data-id="${taskId}"]`);
  if (wrapper) wrapper.classList.remove('swiped');

  // Tampilkan toast
  showToast(task.completed ? 'Tugas diaktifkan kembali' : 'Tugas diselesaikan! ✓');

  if (typeof renderTasks === 'function') renderTasks();
}

function toggleComplete(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  const updated = updateTask(taskId, { completed: !task.completed });
  if (typeof renderTasks === 'function') renderTasks();
  return updated;
}

// =============================================
// DELETE DENGAN KONFIRMASI BOTTOM SHEET
// =============================================

let _pendingDeleteId = null;

function confirmDeleteTask(taskId) {
  _pendingDeleteId = taskId;
  openModal('deleteModal');
}

function closeDeleteModal() {
  _pendingDeleteId = null;
  closeModal('deleteModal');
}

function executeDelete() {
  if (_pendingDeleteId) {
    deleteTask(_pendingDeleteId);
    closeModal('deleteModal');

    // Jika di halaman detail, kembali ke home
    if (window.location.pathname.includes('detail')) {
      window.location.href = 'index.html';
    } else {
      if (typeof renderTasks === 'function') renderTasks();
    }
    _pendingDeleteId = null;
  }
}

// =============================================
// MODAL BOTTOM SHEET
// =============================================

function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('open');
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('open');
}

// Tutup modal saat klik overlay background
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    if (e.target.id === 'deleteModal') {
      _pendingDeleteId = null;
    }
  }
});

// =============================================
// SWIPE GESTURE (touch + mouse)
// =============================================

function initSwipeGestures(listEl) {
  if (!listEl) return;

  let startX = 0;
  let startY = 0;
  let activeWrapper = null;
  let isDragging = false;

  listEl.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    activeWrapper = e.target.closest('.swipe-wrapper');
    isDragging = false;
  }, { passive: true });

  listEl.addEventListener('touchmove', (e) => {
    if (!activeWrapper) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    // Hanya proses swipe horizontal
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) {
      isDragging = true;
    }
  }, { passive: true });

  listEl.addEventListener('touchend', (e) => {
    if (!activeWrapper || !isDragging) return;
    const dx = e.changedTouches[0].clientX - startX;

    if (dx > 60) {
      // Swipe kanan: tampilkan aksi selesai
      closeAllSwipes();
      activeWrapper.classList.add('swiped');
    } else if (dx < -20) {
      activeWrapper.classList.remove('swiped');
    }
    activeWrapper = null;
    isDragging = false;
  }, { passive: true });

  // Dukungan mouse (desktop)
  let mouseStart = 0;
  let mouseWrapper = null;

  listEl.addEventListener('mousedown', (e) => {
    mouseStart = e.clientX;
    mouseWrapper = e.target.closest('.swipe-wrapper');
  });

  document.addEventListener('mouseup', (e) => {
    if (!mouseWrapper) return;
    const dx = e.clientX - mouseStart;
    if (dx > 60 && mouseWrapper.closest('#taskList, #searchResults')) {
      closeAllSwipes();
      mouseWrapper.classList.add('swiped');
    } else if (dx < -20) {
      mouseWrapper.classList.remove('swiped');
    }
    mouseWrapper = null;
  });
}

function closeAllSwipes() {
  document.querySelectorAll('.swipe-wrapper.swiped').forEach(w => w.classList.remove('swiped'));
}

// Tutup swipe saat klik di luar
document.addEventListener('click', (e) => {
  if (!e.target.closest('.swipe-wrapper')) {
    closeAllSwipes();
  }
});

// =============================================
// TOAST NOTIFIKASI
// =============================================

let _toastTimeout = null;

function showToast(message) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'toast';
    document.querySelector('.phone-frame')?.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  if (_toastTimeout) clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// =============================================
// STATUS BAR: UPDATE WAKTU REAL-TIME
// =============================================

function updateStatusTime() {
  const el = document.getElementById('statusTime');
  if (!el) return;
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  el.textContent = `${h}:${m}`;
}

updateStatusTime();
setInterval(updateStatusTime, 30000);

// =============================================
// HELPERS: HITUNG STATISTIK TASK
// =============================================

function getTaskStats() {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    all: tasks.length,
    today: tasks.filter(t => {
      if (!t.deadline) return false;
      const dl = new Date(t.deadline + 'T00:00:00');
      return dl.getTime() === today.getTime();
    }).length,
    urgent: tasks.filter(t => {
      if (t.completed || !t.deadline) return false;
      return getDeadlineDays(t.deadline) <= 1;
    }).length,
    completed: tasks.filter(t => t.completed).length
  };
}

// =============================================
// URL PARAMS HELPER
// =============================================

function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// =============================================
// SEED DATA — isi otomatis saat pertama buka
// Tanggal dibuat dinamis relatif dari hari ini
// =============================================

function seedSampleData() {
  if (getTasks().length > 0) return; // Jangan overwrite data yang sudah ada

  const base = Date.now();
  const d = (offsetDays) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
  };

  const samples = [
    {
      id: String(base - 600000),
      title: 'Kerjakan laporan UTS PFS',
      description: 'Buat laporan lengkap mencakup semua fitur yang sudah dikerjakan. Sertakan screenshot dan penjelasan setiap halaman.',
      deadline: d(1),
      priority: 'high',
      completed: false,
      createdAt: base - 600000
    },
    {
      id: String(base - 500000),
      title: 'Presentasi kelompok Algoritma',
      description: 'Persiapkan slide presentasi dan bagi tugas dengan anggota kelompok. Latihan minimal 2x sebelum hari H.',
      deadline: d(1),
      priority: 'high',
      completed: false,
      createdAt: base - 500000
    },
    {
      id: String(base - 400000),
      title: 'Submit tugas Basis Data',
      description: 'Upload file SQL dan laporan normalisasi ke portal akademik.',
      deadline: d(2),
      priority: 'high',
      completed: false,
      createdAt: base - 400000
    },
    {
      id: String(base - 300000),
      title: 'Baca materi Jaringan Komputer',
      description: 'Pelajari bab 8-10 tentang protokol TCP/IP dan subnetting untuk persiapan ujian.',
      deadline: d(3),
      priority: 'medium',
      completed: false,
      createdAt: base - 300000
    },
    {
      id: String(base - 200000),
      title: 'Review catatan Kalkulus',
      description: 'Ulangi materi integral lipat dan persamaan diferensial.',
      deadline: d(5),
      priority: 'medium',
      completed: false,
      createdAt: base - 200000
    },
    {
      id: String(base - 100000),
      title: 'Daftar seminar teknologi kampus',
      description: 'Pendaftaran seminar AI & Machine Learning ditutup akhir minggu ini.',
      deadline: d(7),
      priority: 'low',
      completed: false,
      createdAt: base - 100000
    },
    {
      id: String(base - 50000),
      title: 'Beli buku referensi Struktur Data',
      description: 'Cari di toko buku atau pinjam dari perpustakaan pusat lantai 3.',
      deadline: d(10),
      priority: 'low',
      completed: true,
      createdAt: base - 50000
    }
  ];

  saveTasks(samples);
}

// Jalankan seed saat script dimuat
seedSampleData();
