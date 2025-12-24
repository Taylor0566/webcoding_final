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
  if (
    !confirm(
      "确定要执行数据备份吗？\n\n✅ 备份将包含：用户、课程、选课、成绩、操作日志等全部数据。"
    )
  )
    return;

  // 获取所有核心数据
  const backupData = {
    users: DB.get("users") || [],
    courses: DB.get("courses") || [],
    enrollments: DB.get("enrollments") || [],
    operationLogs: DB.get("operationLogs") || [],
  };

  // 转为 JSON 并创建下载文件
  const blob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `edu_platform_backup_${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // 记录操作日志
  const logs = DB.get("operationLogs") || [];
  logs.push({
    id: Date.now(),
    userId: app.state.currentUser ? app.state.currentUser.id : "system",
    userName: app.state.currentUser ? app.state.currentUser.name : "系统",
    action: "执行数据备份",
    detail: "手动触发全量数据备份",
    timestamp: new Date().toISOString(),
  });
  DB.set("operationLogs", logs);

  app.showEduToast("✅ 数据已成功备份并下载！");
};

window.restoreData = function () {
  if (
    !confirm(
      "⚠️ 警告：恢复操作将覆盖当前所有数据！\n\n✅ 请确保上传的是本系统生成的备份文件。"
    )
  )
    return;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // 验证是否是有效备份文件（简单检查）
        if (!data.users || !data.courses || !data.enrollments) {
          throw new Error("无效的备份文件格式");
        }

        // 恢复所有数据
        DB.set("users", data.users);
        DB.set("courses", data.courses);
        DB.set("enrollments", data.enrollments);
        DB.set("operationLogs", data.operationLogs || []);

        // 记录恢复日志
        const logs = DB.get("operationLogs") || [];
        logs.push({
          id: Date.now(),
          userId: app.state.currentUser ? app.state.currentUser.id : "system",
          userName: app.state.currentUser ? app.state.currentUser.name : "系统",
          action: "执行数据恢复",
          detail: "从备份文件恢复全部系统数据",
          timestamp: new Date().toISOString(),
        });
        DB.set("operationLogs", logs);

        app.showEduToast("✅ 数据已成功恢复！页面即将刷新……");
        setTimeout(() => location.reload(), 800); // 刷新确保状态一致
      } catch (err) {
        app.showEduToast("❌ 备份文件损坏或格式不正确，恢复失败！");
        console.error("Restore error:", err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
};
