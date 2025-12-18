Object.assign(app, {
    renderSysAdminDashboard() {
        const logs = DB.get('logs');
        const container = document.getElementById('app');

        container.innerHTML = `
            <h2 style="margin-bottom:20px;">系统管理后台</h2>
            <div class="card">
                <div class="card-header"><h3 class="card-title">系统日志</h3></div>
                <table class="data-table">
                    <thead><tr><th>时间</th><th>用户ID</th><th>操作</th></tr></thead>
                    <tbody>
                        ${logs.map(l => `<tr><td>${l.time}</td><td>${l.user}</td><td>${l.action}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div class="card">
                <div class="card-header"><h3 class="card-title">数据维护</h3></div>
                <button class="btn btn-primary" onclick="alert('备份已创建')">立即备份数据</button>
                <button class="btn btn-danger" onclick="alert('功能受限')">恢复数据</button>
            </div>
        `;
    }
});

