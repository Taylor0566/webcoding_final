const app = {
    state: {
        currentUser: null
    },

    init() {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.state.currentUser = JSON.parse(storedUser);
            this.updateNav();
            this.renderDashboard();
        } else {
            this.renderHome();
        }
    },

    // --- Authentication ---

    showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    },

    hideLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('loginForm').reset();
    },

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const result = DB.login(username, password);
        if (result.success) {
            const user = result.user;
            this.state.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.hideLoginModal();
            this.updateNav();
            this.showToast(`欢迎回来，${user.name} (${this.getRoleName(user.role)})`);
            this.renderDashboard();
        } else {
            alert(result.error);
        }
    },

    logout() {
        this.state.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateNav();
        this.renderHome();
        this.showToast('已安全退出');
    },

    getRoleName(role) {
        const map = {
            'student': '学生',
            'teacher': '教师',
            'edu_admin': '教学管理员',
            'sys_admin': '系统管理员'
        };
        return map[role] || '用户';
    },

    updateNav() {
        const navLinks = document.getElementById('navLinks');
        if (this.state.currentUser) {
            navLinks.innerHTML = `
                <a href="#" onclick="app.renderDashboard()">控制台</a>
                <a href="#" onclick="app.logout()">退出登录</a>
                <span style="color:white; margin-left:15px; opacity:0.8;">${this.state.currentUser.name}</span>
            `;
        } else {
            navLinks.innerHTML = `
                <a href="#" onclick="app.renderHome()">首页</a>
                <a href="#" onclick="app.showLoginModal()">登录</a>
            `;
        }
    },

    // --- Rendering Core ---

    renderHome() {
        const container = document.getElementById('app');
        const courses = DB.get('courses').filter(c => c.status === 'published');
        
        container.innerHTML = `
            <div class="hero-section">
                <h1 class="hero-title">成绩管理教学平台</h1>
                <p class="hero-subtitle">高效、便捷、专业的教学教务管理系统</p>
                ${!this.state.currentUser ? `<button class="btn btn-primary" onclick="app.showLoginModal()" style="padding: 12px 30px; font-size: 18px;">立即登录</button>` : ''}
            </div>
            
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">热门课程</h3>
                    <input type="text" placeholder="搜索课程..." class="form-input" style="width: 200px;" oninput="app.filterPublicCourses(this.value)">
                </div>
                <div id="publicCourseList">
                    ${this.renderCourseCards(courses)}
                </div>
            </div>
        `;
    },

    renderCourseCards(courses) {
        if (courses.length === 0) return '<div style="padding:20px; text-align:center; color:#888;">暂无课程</div>';
        
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                ${courses.map(c => `
                    <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; background: #fafafa;">
                        <h4 style="font-size:18px; margin-bottom:8px;">${c.name}</h4>
                        <div style="color:#666; font-size:14px; margin-bottom:12px;">
                            <span style="background:#eee; padding:2px 6px; border-radius:4px;">${c.id}</span>
                            <span style="margin-left:8px;">${c.teacherName}</span>
                            <span style="float:right;">${c.credit} 学分</span>
                        </div>
                        <p style="font-size:13px; color:#888; margin-bottom:15px; height: 40px; overflow:hidden;">${c.desc}</p>
                        <div style="font-size:12px; color:#555;">${c.schedule} | ${c.classroom}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    filterPublicCourses(keyword) {
        const courses = DB.get('courses').filter(c => 
            c.status === 'published' && 
            (c.name.includes(keyword) || c.id.includes(keyword) || c.dept.includes(keyword))
        );
        document.getElementById('publicCourseList').innerHTML = this.renderCourseCards(courses);
    },

    renderDashboard() {
        const user = this.state.currentUser;
        if (!user) return this.renderHome();

        if (user.role === 'student') this.renderStudentDashboard();
        else if (user.role === 'teacher') this.renderTeacherDashboard();
        else if (user.role === 'edu_admin') this.renderEduAdminDashboard();
        else if (user.role === 'sys_admin') this.renderSysAdminDashboard();
    },

    // --- Student Views ---

    renderStudentDashboard() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <h2 style="margin-bottom:20px;">学生工作台</h2>
            <div style="display:flex; gap:20px; margin-bottom:20px;">
                <button class="btn btn-primary" onclick="app.renderStudentMyCourses()">我的课程</button>
                <button class="btn btn-secondary" onclick="app.renderStudentAllCourses()">选课中心</button>
                <button class="btn btn-secondary" onclick="app.renderStudentGrades()">成绩单</button>
            </div>
            <div id="studentContent">
                <!-- 默认显示我的课程 -->
            </div>
        `;
        this.renderStudentMyCourses();
    },

    renderStudentMyCourses() {
        const enrollments = DB.get('enrollments').filter(e => e.studentId === this.state.currentUser.id);
        const courses = DB.get('courses');
        
        const myCourses = enrollments.map(e => {
            const c = courses.find(course => course.id === e.courseId);
            return { ...c, ...e };
        });

        const html = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">我正在修读的课程</h3></div>
                <table class="data-table">
                    <thead><tr><th>课程号</th><th>课程名</th><th>教师</th><th>学分</th><th>状态</th></tr></thead>
                    <tbody>
                        ${myCourses.map(c => `
                            <tr>
                                <td>${c.id}</td>
                                <td>${c.name}</td>
                                <td>${c.teacherName}</td>
                                <td>${c.credit}</td>
                                <td><span style="color:${c.grade ? '#34c759' : '#0066cc'}">${c.grade ? '已结课' : '进行中'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    },

    renderStudentAllCourses() {
        const courses = DB.get('courses').filter(c => c.status === 'published');
        const enrollments = DB.get('enrollments').filter(e => e.studentId === this.state.currentUser.id);
        const enrolledIds = enrollments.map(e => e.courseId);

        const html = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">选课中心</h3></div>
                <table class="data-table">
                    <thead><tr><th>课程号</th><th>课程名</th><th>教师</th><th>时间</th><th>操作</th></tr></thead>
                    <tbody>
                        ${courses.map(c => {
                            const isEnrolled = enrolledIds.includes(c.id);
                            return `
                                <tr>
                                    <td>${c.id}</td>
                                    <td>${c.name}</td>
                                    <td>${c.teacherName}</td>
                                    <td>${c.schedule}</td>
                                    <td>
                                        ${isEnrolled 
                                            ? '<button class="btn btn-secondary" disabled>已选</button>' 
                                            : `<button class="btn btn-primary" onclick="app.enrollCourse('${c.id}')">选课</button>`
                                        }
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    },

    enrollCourse(courseId) {
        if (!confirm('确定要选修这门课程吗？')) return;
        
        const enrollments = DB.get('enrollments');
        enrollments.push({
            studentId: this.state.currentUser.id,
            courseId: courseId,
            grade: null,
            details: { homework: null, midterm: null, final: null }
        });
        DB.set('enrollments', enrollments);
        this.showToast('选课成功！');
        this.renderStudentAllCourses(); // Refresh
    },

    renderStudentGrades() {
        const enrollments = DB.get('enrollments').filter(e => e.studentId === this.state.currentUser.id && e.grade !== null);
        const courses = DB.get('courses');
        
        const html = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">我的成绩单</h3></div>
                <table class="data-table">
                    <thead><tr><th>课程</th><th>学分</th><th>平时分</th><th>期中</th><th>期末</th><th>总评</th></tr></thead>
                    <tbody>
                        ${enrollments.map(e => {
                            const c = courses.find(course => course.id === e.courseId);
                            return `
                                <tr>
                                    <td>${c.name}</td>
                                    <td>${c.credit}</td>
                                    <td>${e.details.homework || '-'}</td>
                                    <td>${e.details.midterm || '-'}</td>
                                    <td>${e.details.final || '-'}</td>
                                    <td style="font-weight:bold; color:#0066cc;">${e.grade}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    },

    // --- Teacher Views ---

    renderTeacherDashboard() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <h2 style="margin-bottom:20px;">教师工作台</h2>
            <div id="teacherContent">
                ${this.getTeacherCourseListHTML()}
            </div>
        `;
    },

    getTeacherCourseListHTML() {
        const courses = DB.get('courses').filter(c => c.teacherId === this.state.currentUser.id);
        
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">我教授的课程</h3>
                    <button class="btn btn-primary" style="float:right;" onclick="app.renderTeacherCreateCourse()">发布新课程</button>
                </div>
                <table class="data-table">
                    <thead><tr><th>课程号</th><th>课程名</th><th>状态</th><th>选课人数</th><th>操作</th></tr></thead>
                    <tbody>
                        ${courses.map(c => {
                            const count = DB.get('enrollments').filter(e => e.courseId === c.id).length;
                            return `
                                <tr>
                                    <td>${c.id}</td>
                                    <td>${c.name}</td>
                                    <td>${c.status === 'published' ? '已发布' : '草稿'}</td>
                                    <td>${count}</td>
                                    <td>
                                        <button class="btn btn-secondary" onclick="app.renderTeacherGradeEntry('${c.id}')">录入成绩</button>
                                        <button class="btn btn-secondary" onclick="app.renderTeacherEditCourse('${c.id}')">管理</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderTeacherGradeEntry(courseId) {
        const course = DB.get('courses').find(c => c.id === courseId);
        const enrollments = DB.get('enrollments').filter(e => e.courseId === courseId);
        const users = DB.get('users');

        const html = `
            <button class="btn btn-secondary" onclick="app.renderTeacherDashboard()" style="margin-bottom:20px;">&larr; 返回课程列表</button>
            <div class="card">
                <div class="card-header"><h3 class="card-title">成绩录入 - ${course.name}</h3></div>
                <table class="data-table">
                    <thead><tr><th>学号</th><th>姓名</th><th>平时分 (30%)</th><th>期中 (30%)</th><th>期末 (40%)</th><th>总评</th><th>操作</th></tr></thead>
                    <tbody id="gradeTableBody">
                        ${enrollments.map(e => {
                            const s = users.find(u => u.id === e.studentId);
                            return `
                                <tr data-sid="${s.id}">
                                    <td>${s.id}</td>
                                    <td>${s.name}</td>
                                    <td><input type="number" class="form-input" style="width:80px;" value="${e.details.homework || ''}" onchange="app.calcGrade('${s.id}')" id="hw_${s.id}"></td>
                                    <td><input type="number" class="form-input" style="width:80px;" value="${e.details.midterm || ''}" onchange="app.calcGrade('${s.id}')" id="mid_${s.id}"></td>
                                    <td><input type="number" class="form-input" style="width:80px;" value="${e.details.final || ''}" onchange="app.calcGrade('${s.id}')" id="fin_${s.id}"></td>
                                    <td id="total_${s.id}" style="font-weight:bold;">${e.grade || '-'}</td>
                                    <td><button class="btn btn-primary" onclick="app.saveSingleGrade('${courseId}', '${s.id}')">保存</button></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('teacherContent').innerHTML = html;
    },

    calcGrade(sid) {
        const hw = parseFloat(document.getElementById(`hw_${sid}`).value) || 0;
        const mid = parseFloat(document.getElementById(`mid_${sid}`).value) || 0;
        const fin = parseFloat(document.getElementById(`fin_${sid}`).value) || 0;
        const total = Math.round(hw * 0.3 + mid * 0.3 + fin * 0.4);
        document.getElementById(`total_${sid}`).innerText = total;
    },

    saveSingleGrade(courseId, studentId) {
        const hw = parseFloat(document.getElementById(`hw_${studentId}`).value) || 0;
        const mid = parseFloat(document.getElementById(`mid_${studentId}`).value) || 0;
        const fin = parseFloat(document.getElementById(`fin_${studentId}`).value) || 0;
        const total = Math.round(hw * 0.3 + mid * 0.3 + fin * 0.4);

        const enrollments = DB.get('enrollments');
        const idx = enrollments.findIndex(e => e.courseId === courseId && e.studentId === studentId);
        if (idx !== -1) {
            enrollments[idx].grade = total;
            enrollments[idx].details = { homework: hw, midterm: mid, final: fin };
            DB.set('enrollments', enrollments);
            this.showToast('成绩已保存');
        }
    },

    renderTeacherCreateCourse() {
        const html = `
            <button class="btn btn-secondary" onclick="app.renderTeacherDashboard()" style="margin-bottom:20px;">&larr; 返回</button>
            <div class="card">
                <div class="card-header"><h3 class="card-title">发布新课程</h3></div>
                <form onsubmit="app.handleCreateCourse(event)">
                    <div class="form-group">
                        <label class="form-label">课程名称</label>
                        <input type="text" id="new_name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">课程号 (如 C004)</label>
                        <input type="text" id="new_id" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">学分</label>
                        <input type="number" id="new_credit" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">上课时间</label>
                        <input type="text" id="new_schedule" class="form-input" placeholder="如：周一 1-2节">
                    </div>
                    <div class="form-group">
                        <label class="form-label">教室</label>
                        <input type="text" id="new_classroom" class="form-input" placeholder="如：N101">
                    </div>
                    <div class="form-group">
                        <label class="form-label">课程简介</label>
                        <textarea id="new_desc" class="form-input" rows="4"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">发布课程</button>
                </form>
            </div>
        `;
        document.getElementById('teacherContent').innerHTML = html;
    },

    handleCreateCourse(e) {
        e.preventDefault();
        const courses = DB.get('courses');
        const newCourse = {
            id: document.getElementById('new_id').value,
            name: document.getElementById('new_name').value,
            credit: parseInt(document.getElementById('new_credit').value),
            teacherId: this.state.currentUser.id,
            teacherName: this.state.currentUser.name,
            dept: '未知学院',
            desc: document.getElementById('new_desc').value,
            status: 'published',
            schedule: document.getElementById('new_schedule').value,
            classroom: document.getElementById('new_classroom').value
        };
        
        courses.push(newCourse);
        DB.set('courses', courses);
        
        // Log action
        const logs = DB.get('logs');
        logs.push({
            id: Date.now(),
            user: this.state.currentUser.id,
            action: `Create Course ${newCourse.id}`,
            time: new Date().toLocaleString()
        });
        DB.set('logs', logs);

        this.showToast('课程发布成功');
        this.renderTeacherDashboard();
    },

    renderTeacherEditCourse(courseId) {
        const course = DB.get('courses').find(c => c.id === courseId);
        
        const html = `
            <button class="btn btn-secondary" onclick="app.renderTeacherDashboard()" style="margin-bottom:20px;">&larr; 返回</button>
            <div class="card">
                <div class="card-header"><h3 class="card-title">编辑课程 - ${course.name}</h3></div>
                <form onsubmit="app.handleUpdateCourse(event, '${courseId}')">
                    <div class="form-group">
                        <label class="form-label">课程简介</label>
                        <textarea id="edit_desc" class="form-input" rows="4">${course.desc}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">上课时间</label>
                        <input type="text" id="edit_schedule" class="form-input" value="${course.schedule}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">教室</label>
                        <input type="text" id="edit_classroom" class="form-input" value="${course.classroom}">
                    </div>
                     <div class="form-group">
                        <label class="form-label">课件上传 (模拟)</label>
                        <input type="file" class="form-input">
                    </div>
                    <button type="submit" class="btn btn-primary">保存修改</button>
                </form>
            </div>
        `;
        document.getElementById('teacherContent').innerHTML = html;
    },

    handleUpdateCourse(e, courseId) {
        e.preventDefault();
        const courses = DB.get('courses');
        const idx = courses.findIndex(c => c.id === courseId);
        if (idx !== -1) {
            courses[idx].desc = document.getElementById('edit_desc').value;
            courses[idx].schedule = document.getElementById('edit_schedule').value;
            courses[idx].classroom = document.getElementById('edit_classroom').value;
            DB.set('courses', courses);
            this.showToast('课程信息已更新');
            this.renderTeacherDashboard();
        }
    },

    // --- Admin Views (Simplified) ---

    renderEduAdminDashboard() {
        const container = document.getElementById('app');
        const users = DB.get('users').filter(u => u.role === 'student');
        
        container.innerHTML = `
            <h2 style="margin-bottom:20px;">教学管理后台</h2>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">学生管理</h3>
                    <button class="btn btn-primary" style="float:right;" onclick="alert('模拟导入成功：已导入50名学生')">批量导入学生 (Excel)</button>
                </div>
                <table class="data-table">
                    <thead><tr><th>学号</th><th>姓名</th><th>班级</th><th>操作</th></tr></thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>${u.id}</td>
                                <td>${u.name}</td>
                                <td>${u.class || '-'}</td>
                                <td><button class="btn btn-danger" onclick="alert('模拟删除')">删除</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
             <div class="card">
                <div class="card-header"><h3 class="card-title">排课管理</h3></div>
                <p style="color:#666;">此处进行排课、教室分配等操作。</p>
            </div>
        `;
    },

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
    },

    // --- Utils ---
    showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.style.display = 'block';
        setTimeout(() => t.style.display = 'none', 3000);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
