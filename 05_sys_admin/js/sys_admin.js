Object.assign(app, {
  renderSysAdminDashboard() {
    const logs = DB.get("logs") || [];
    const container = document.getElementById("app");

    // 时间格式化工具（正确处理 Date 对象）
    const formatDateTimeLocal = (date) => {
      const pad = (n) => String(n).padStart(2, "0");
      const d = new Date(date); // 确保是 Date 类型
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // 渲染日志行
    const renderLogRows = (logList) => {
      return logList
        .map(
          (l) =>
            `<tr><td>${new Date(l.time).toLocaleString("zh-CN")}</td><td>${
              l.user
            }</td><td>${l.action}</td></tr>`
        )
        .join("");
    };

    // 构建 HTML
    container.innerHTML = `
      <h2 style="margin-bottom:20px;">系统管理后台</h2>

      <!-- 日志查询 -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><h3 class="card-title">日志查询</h3></div>
        <div class="card-body">
          <div style="display:flex;gap:15px;flex-wrap:wrap;align-items:end;">
            <div>
              <label>开始时间</label>
              <input type="datetime-local" id="log-start" class="form-control"
                     value="${formatDateTimeLocal(
                       new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                     )}">
            </div>
            <div>
              <label>结束时间</label>
              <input type="datetime-local" id="log-end" class="form-control"
                     value="${formatDateTimeLocal(new Date())}">
            </div>
            <button class="btn btn-secondary" onclick="filterLogs()">筛选</button>
            <button class="btn btn-outline-secondary" onclick="exportLogs()">导出 CSV</button>
          </div>
        </div>
      </div>

      <!-- 系统日志表格 -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><h3 class="card-title">系统日志</h3></div>
        <table class="data-table">
          <thead><tr><th>时间</th><th>用户ID</th><th>操作</th></tr></thead>
          <tbody id="log-tbody">
            ${renderLogRows(logs)}
          </tbody>
        </table>
      </div>

      <!-- 数据维护 -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">数据维护</h3></div>
        <div class="card-body">
          <button class="btn btn-primary" onclick="backupData()">立即备份数据</button>
          <button class="btn btn-danger" onclick="restoreData()">恢复数据</button>
        </div>
      </div>
    `;
  },
});

// 全局函数（放在外面，避免内联 JS 被破坏）
window.filterLogs = function () {
  const logs = DB.get("logs") || [];
  const start = document.getElementById("log-start").value;
  const end = document.getElementById("log-end").value;

  let filtered = logs;
  if (start) {
    filtered = filtered.filter((l) => new Date(l.time) >= new Date(start));
  }
  if (end) {
    filtered = filtered.filter((l) => new Date(l.time) <= new Date(end));
  }

  const tbody = document.getElementById("log-tbody");
  tbody.innerHTML = filtered
    .map(
      (l) =>
        `<tr><td>${new Date(l.time).toLocaleString("zh-CN")}</td><td>${
          l.user
        }</td><td>${l.action}</td></tr>`
    )
    .join("");
};

window.exportLogs = function () {
  const logs = DB.get("logs") || [];
  if (logs.length === 0) {
    alert("无日志可导出");
    return;
  }

  let csv = "时间,用户ID,操作\n";
  logs.forEach((l) => {
    const time = new Date(l.time).toLocaleString("zh-CN");
    csv += `"${time}","${l.user}","${l.action}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "system_logs.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

window.backupData = function () {
  if (!confirm("确定要执行数据备份吗？")) return;
  alert("✅ 数据已成功备份（模拟）");

  const allLogs = DB.get("logs") || [];
  allLogs.push({
    user: "SA001",
    action: "执行数据备份",
    time: new Date().toISOString(),
  });
  DB.set("logs", allLogs);

  app.renderSysAdminDashboard(); // 刷新页面
};

window.restoreData = function () {
  if (!confirm("⚠️ 恢复将覆盖当前所有数据！确定继续吗？")) return;
  alert("✅ 数据已恢复（模拟）");
};
