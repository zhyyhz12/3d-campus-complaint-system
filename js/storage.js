/**
 * 存储模块 - 管理身份信息与投诉数据（基于 localStorage）
 */
const Store = {
  // ═══ 身份管理 ═══
  setUser(user) {
    localStorage.setItem('qau_user', JSON.stringify(user));
  },
  getUser() {
    const raw = localStorage.getItem('qau_user');
    return raw ? JSON.parse(raw) : null;
  },
  clearUser() {
    localStorage.removeItem('qau_user');
  },

  // ═══ 投诉管理 ═══
  getComplaints() {
    const raw = localStorage.getItem('qau_complaints');
    return raw ? JSON.parse(raw) : [];
  },

  addComplaint(complaint) {
    const list = this.getComplaints();
    complaint.id = 'CP' + Date.now() + Math.floor(Math.random() * 1000);
    complaint.createdAt = new Date().toISOString();
    complaint.status = 'pending'; // pending | replied
    complaint.reply = '';
    list.unshift(complaint); // 最新的在前
    localStorage.setItem('qau_complaints', JSON.stringify(list));
    return complaint;
  },

  updateComplaint(id, updates) {
    const list = this.getComplaints();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem('qau_complaints', JSON.stringify(list));
      return list[idx];
    }
    return null;
  },

  deleteComplaint(id) {
    const list = this.getComplaints().filter(c => c.id !== id);
    localStorage.setItem('qau_complaints', JSON.stringify(list));
  },

  clearAllComplaints() {
    localStorage.removeItem('qau_complaints');
  }
};
