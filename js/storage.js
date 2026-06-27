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
  },

  // ═══ 投诉查询 ═══
  // 获取某栋建筑内所有活跃投诉的房间 ID 集合（按 roomId 分组，返回 {roomId: [category, ...]}）
  getActiveComplaintsByBuilding(buildingId) {
    const list = this.getComplaints();
    const result = {};
    list.filter(c => c.status === 'pending').forEach(c => {
      // buildingId 可能是 roomId（如 'main-lobby'）或建筑 id
      const rooms = window.BUILDING_ROOMS && window.BUILDING_ROOMS[buildingId];
      if (!rooms) return;
      // 检查该投诉的 buildingId 是否属于当前建筑的某个房间
      const matchedRoom = rooms.find(r => r.id === c.buildingId);
      if (matchedRoom) {
        if (!result[c.buildingId]) result[c.buildingId] = [];
        if (!result[c.buildingId].includes(c.category)) {
          result[c.buildingId].push(c.category);
        }
      }
    });
    return result;
  },

  // 检测重复投诉：同房间+同方向+24h内有pending投诉
  checkDuplicate(roomId, category) {
    const list = this.getComplaints();
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    return list.some(c =>
      c.buildingId === roomId &&
      c.category === category &&
      c.status === 'pending' &&
      (now - new Date(c.createdAt).getTime()) < DAY
    );
  },

  // ═══ 已回复投诉通知 ═══
  // 获取该用户所有已被回复的投诉
  getRepliedComplaintsForUser(reporter) {
    return this.getComplaints().filter(c =>
      c.status === 'replied' &&
      c.reporter === reporter &&
      c.reply // 有回复内容
    );
  },

  // 获取某条投诉已通知次数
  getNotifyCount(complaintId) {
    const raw = localStorage.getItem('qau_notified');
    const map = raw ? JSON.parse(raw) : {};
    return map[complaintId] || 0;
  },

  // 标记已通知（次数+1）
  markNotified(complaintId) {
    const raw = localStorage.getItem('qau_notified');
    const map = raw ? JSON.parse(raw) : {};
    map[complaintId] = (map[complaintId] || 0) + 1;
    localStorage.setItem('qau_notified', JSON.stringify(map));
  }
};
