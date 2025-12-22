Object.assign(app, {
    ensureTeacherCourseViewState() {
        if (!this.state.teacherCourseView) {
            this.state.teacherCourseView = {
                keyword: '',
                page: 1,
                pageSize: 10
            };
        }
        return this.state.teacherCourseView;
    },

    renderTeacherDashboard() {
        this.ensureTeacherCourseViewState();
        const container = document.getElementById('app');
        container.innerHTML = `
            <h2 style="margin-bottom:20px;">教师工作台</h2>
            <div id="teacherContent">
                ${this.getTeacherCourseListHTML()}
            </div>
        `;
    },

    renderTeacherCourseList() {
        this.ensureTeacherCourseViewState();
        const el = document.getElementById('teacherContent');
        if (!el) return this.renderTeacherDashboard();
        el.innerHTML = this.getTeacherCourseListHTML();
    },

    setTeacherCourseKeyword(keyword) {
        const view = this.ensureTeacherCourseViewState();
        view.keyword = String(keyword || '');
        view.page = 1;
        this.renderTeacherCourseList();
    },

    goTeacherCoursePage(page) {
        const view = this.ensureTeacherCourseViewState();
        const next = Number(page) || 1;
        view.page = next;
        this.renderTeacherCourseList();
    },

    getTeacherCourseListHTML() {
        const view = this.ensureTeacherCourseViewState();
        const keyword = (view.keyword || '').trim();
        const pageSize = view.pageSize || 10;

        let courses = DB.get('courses').filter(c => c.teacherId === this.state.currentUser.id);
        if (keyword) {
            courses = courses.filter(c => {
                const id = String(c.id || '');
                const name = String(c.name || '');
                const schedule = String(c.schedule || '');
                const classroom = String(c.classroom || '');
                return id.includes(keyword) || name.includes(keyword) || schedule.includes(keyword) || classroom.includes(keyword);
            });
        }

        courses.sort((a, b) => String(a.id || '').localeCompare(String(b.id || ''), 'zh-CN'));

        const total = courses.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const page = Math.min(Math.max(1, view.page || 1), totalPages);
        view.page = page;

        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageCourses = courses.slice(start, end);

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        const pages = [];
        for (let p = startPage; p <= endPage; p++) pages.push(p);

        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">我教授的课程</h3>
                    <button class="btn btn-primary" style="float:right;" onclick="app.renderTeacherCreateCourse()">发布新课程</button>
                    <input
                        type="text"
                        placeholder="搜索课程号/名称/时间/教室..."
                        class="form-input"
                        style="width: 280px; float:right; margin-right:12px; height: 36px; padding: 8px 12px;"
                        value="${keyword}"
                        oninput="app.setTeacherCourseKeyword(this.value)"
                    >
                </div>
                <table class="data-table">
                    <thead><tr><th>课程号</th><th>课程名</th><th>状态</th><th>选课人数</th><th>操作</th></tr></thead>
                    <tbody>
                        ${pageCourses.map(c => {
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
                        ${pageCourses.length === 0 ? `<tr><td colspan="5" style="color:#888; padding:18px 12px;">暂无匹配课程</td></tr>` : ''}
                    </tbody>
                </table>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
                    <div style="color:#666; font-size:13px;">共 ${total} 门课程，第 ${page}/${totalPages} 页</div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="btn btn-secondary" ${page <= 1 ? 'disabled' : ''} onclick="app.goTeacherCoursePage(${page - 1})">上一页</button>
                        ${pages.map(p => `
                            <button class="btn ${p === page ? 'btn-primary' : 'btn-secondary'}" onclick="app.goTeacherCoursePage(${p})">${p}</button>
                        `).join('')}
                        <button class="btn btn-secondary" ${page >= totalPages ? 'disabled' : ''} onclick="app.goTeacherCoursePage(${page + 1})">下一页</button>
                    </div>
                </div>
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
    }
});
