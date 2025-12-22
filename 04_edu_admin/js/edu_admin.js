Object.assign(app, {
    // ==================== 初始化 ====================
    renderEduAdminDashboard() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <h2 style="margin-bottom:20px;">教学管理工作台</h2>
            
            <div style="display:flex; gap:20px; margin-bottom:20px; flex-wrap:wrap;">
                <button id="nav-edu-dashboard" class="btn btn-primary" onclick="app.renderEduAdminHome()">工作台</button>
                <button id="nav-edu-students" class="btn btn-secondary" onclick="app.renderEduAdminStudents()">学生管理</button>
                <button id="nav-edu-teachers" class="btn btn-secondary" onclick="app.renderEduAdminTeachers()">教师管理</button>
                <button id="nav-edu-courses" class="btn btn-secondary" onclick="app.renderEduAdminCourses()">课程管理</button>
                <button id="nav-edu-classes" class="btn btn-secondary" onclick="app.renderEduAdminClasses()">班级管理</button>
                <button id="nav-edu-schedules" class="btn btn-secondary" onclick="app.renderEduAdminSchedules()">排课管理</button>
                <button id="nav-edu-grades" class="btn btn-secondary" onclick="app.renderEduAdminGrades()">成绩审核</button>
            </div>
            
            <div id="eduAdminContent"></div>
        `;
        
        this.renderEduAdminHome();
    },

    updateEduAdminNav(activeId) {
        const navIds = ['nav-edu-dashboard', 'nav-edu-students', 'nav-edu-teachers', 'nav-edu-courses', 'nav-edu-classes', 'nav-edu-schedules', 'nav-edu-grades'];
        navIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.className = id === activeId ? 'btn btn-primary' : 'btn btn-secondary';
        });
    },

    showEduToast(message) {
        this.showToast(message);
    },

    // ==================== 工作台 ====================
    renderEduAdminHome() {
        this.updateEduAdminNav('nav-edu-dashboard');
        
        const students = DB.get('users').filter(u => u.role === 'student');
        const teachers = DB.get('users').filter(u => u.role === 'teacher');
        const courses = DB.get('courses');
        const enrollments = DB.get('enrollments');
        
        const gradedCount = enrollments.filter(e => e.grade !== null).length;
        const pendingCount = enrollments.filter(e => e.grade === null).length;

        const html = `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:30px;">
                <div class="card" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:20px;">
                    <div style="font-size:14px; opacity:0.9; margin-bottom:8px;">学生总数</div>
                    <div style="font-size:36px; font-weight:bold;">${students.length}</div>
                </div>
                <div class="card" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color:white; padding:20px;">
                    <div style="font-size:14px; opacity:0.9; margin-bottom:8px;">教师总数</div>
                    <div style="font-size:36px; font-weight:bold;">${teachers.length}</div>
                </div>
                <div class="card" style="background:linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color:white; padding:20px;">
                    <div style="font-size:14px; opacity:0.9; margin-bottom:8px;">课程总数</div>
                    <div style="font-size:36px; font-weight:bold;">${courses.length}</div>
                </div>
                <div class="card" style="background:linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color:white; padding:20px;">
                    <div style="font-size:14px; opacity:0.9; margin-bottom:8px;">已录成绩</div>
                    <div style="font-size:36px; font-weight:bold;">${gradedCount}</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3 class="card-title">快速操作</h3></div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; padding:20px;">
                    <button class="btn btn-primary" style="padding:15px;" onclick="app.renderEduAdminStudents()">📚 学生管理</button>
                    <button class="btn btn-primary" style="padding:15px;" onclick="app.renderEduAdminTeachers()">👨‍🏫 教师管理</button>
                    <button class="btn btn-primary" style="padding:15px;" onclick="app.renderEduAdminCourses()">📖 课程管理</button>
                    <button class="btn btn-primary" style="padding:15px;" onclick="app.renderEduAdminSchedules()">📅 排课管理</button>
                    <button class="btn btn-primary" style="padding:15px;" onclick="app.renderEduAdminGrades()">📊 成绩审核</button>
                </div>
            </div>
        `;
        
        document.getElementById('eduAdminContent').innerHTML = html;
    },

    // ==================== 学生管理 ====================
    renderEduAdminStudents() {
        this.updateEduAdminNav('nav-edu-students');
        
        const students = DB.get('users').filter(u => u.role === 'student');
        const enrollments = DB.get('enrollments');
        
        const html = `
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">学生列表</h3>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="studentSearchInput" placeholder="搜索学号/姓名..." 
                            style="padding:8px; border:1px solid #ddd; border-radius:4px; width:200px;"
                            oninput="app.searchEduStudents(this.value)">
                        <button class="btn btn-primary" onclick="app.showAddStudentModal()">添加学生</button>
                        <button class="btn btn-secondary" onclick="app.importStudentsDemo()">批量导入</button>
                    </div>
                </div>
                <table class="data-table" id="studentsTable">
                    <thead>
                        <tr>
                            <th style="width:15%">学号</th>
                            <th style="width:15%">姓名</th>
                            <th style="width:20%">班级</th>
                            <th style="width:20%">专业</th>
                            <th style="width:10%">选课数</th>
                            <th style="width:20%">操作</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody">
                        ${this.renderStudentRows(students, enrollments)}
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('eduAdminContent').innerHTML = html;
    },

    renderStudentRows(students, enrollments) {
        if (students.length === 0) {
            return '<tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">暂无学生数据</td></tr>';
        }
        
        return students.map(s => {
            const courseCount = enrollments.filter(e => e.studentId === s.id).length;
            return `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.name}</td>
                    <td>${s.class || '未分配'}</td>
                    <td>${s.major || '未知'}</td>
                    <td>${courseCount}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding:4px 12px; font-size:12px;" onclick="app.viewStudentCourses('${s.id}')">课程表</button>
                        <button class="btn btn-secondary" style="padding:4px 12px; font-size:12px;" onclick="app.editStudent('${s.id}')">编辑</button>
                        <button class="btn btn-danger" style="padding:4px 12px; font-size:12px;" onclick="app.deleteStudent('${s.id}')">删除</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    searchEduStudents(keyword) {
        const allStudents = DB.get('users').filter(u => u.role === 'student');
        const enrollments = DB.get('enrollments');
        
        const filtered = allStudents.filter(s => 
            s.id.toLowerCase().includes(keyword.toLowerCase()) ||
            s.name.toLowerCase().includes(keyword.toLowerCase()) ||
            (s.class && s.class.toLowerCase().includes(keyword.toLowerCase()))
        );
        
        document.getElementById('studentsTableBody').innerHTML = this.renderStudentRows(filtered, enrollments);
    },

    viewStudentCourses(studentId) {
        const student = DB.get('users').find(u => u.id === studentId);
        const enrollments = DB.get('enrollments').filter(e => e.studentId === studentId);
        const courses = DB.get('courses');
        
        const courseList = enrollments.map(e => {
            const course = courses.find(c => c.id === e.courseId);
            return {
                ...course,
                schedule: course ? course.schedule : '未排课',
                classroom: course ? course.classroom : '-'
            };
        });
        
        const modalContent = `
            <h4 style="margin-bottom:15px;">${student.name}（${studentId}）的课程表</h4>
            ${courseList.length > 0 ? `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>课程号</th>
                            <th>课程名</th>
                            <th>教师</th>
                            <th>时间</th>
                            <th>教室</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${courseList.map(c => `
                            <tr>
                                <td>${c.id}</td>
                                <td>${c.name}</td>
                                <td>${c.teacherName}</td>
                                <td>${c.schedule}</td>
                                <td>${c.classroom}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top:15px; color:#666; font-size:14px;">
                    总学分：<strong>${courseList.reduce((sum, c) => sum + (c.credit || 0), 0)}</strong> | 
                    已选课程：<strong>${courseList.length}</strong>门
                </div>
            ` : '<div style="text-align:center; padding:40px; color:#888;">该学生尚未选课</div>'}
        `;
        
        this.showEduModal('学生课程表', modalContent);
    },

    showAddStudentModal() {
        const modalContent = `
            <form onsubmit="app.handleAddStudent(event)">
                <div class="form-group">
                    <label class="form-label">学号</label>
                    <input type="text" id="newStudentId" class="form-input" required placeholder="例如：S2024001">
                </div>
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input type="text" id="newStudentName" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">班级</label>
                    <input type="text" id="newStudentClass" class="form-input" placeholder="例如：2021级计算机1班">
                </div>
                <div class="form-group">
                    <label class="form-label">专业</label>
                    <input type="text" id="newStudentMajor" class="form-input" placeholder="例如：计算机科学与技术">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">添加学生</button>
            </form>
        `;
        
        this.showEduModal('添加学生', modalContent);
    },

    handleAddStudent(e) {
        e.preventDefault();
        
        const users = DB.get('users');
        const newId = document.getElementById('newStudentId').value.trim();
        
        if (users.find(u => u.id === newId)) {
            alert('学号已存在！');
            return;
        }
        
        const newStudent = {
            id: newId,
            name: document.getElementById('newStudentName').value.trim(),
            role: 'student',
            email: `${newId.toLowerCase()}@szu.edu.cn`,
            class: document.getElementById('newStudentClass').value.trim(),
            major: document.getElementById('newStudentMajor').value.trim(),
            passwordHash: btoa(newId + 'password'),
            salt: newId,
            loginAttempts: 0,
            lockUntil: 0
        };
        
        users.push(newStudent);
        DB.set('users', users);
        
        this.closeEduModal();
        this.showEduToast('✅ 添加成功');
        this.renderEduAdminStudents();
    },

    editStudent(studentId) {
        const student = DB.get('users').find(u => u.id === studentId);
        if (!student) return;
        
        const modalContent = `
            <form onsubmit="app.handleEditStudent(event, '${studentId}')">
                <div class="form-group">
                    <label class="form-label">学号</label>
                    <input type="text" class="form-input" value="${student.id}" readonly style="background:#f5f5f5;">
                </div>
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input type="text" id="editStudentName" class="form-input" value="${student.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">班级</label>
                    <input type="text" id="editStudentClass" class="form-input" value="${student.class || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">专业</label>
                    <input type="text" id="editStudentMajor" class="form-input" value="${student.major || ''}">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">保存修改</button>
            </form>
        `;
        
        this.showEduModal('编辑学生信息', modalContent);
    },

    handleEditStudent(e, studentId) {
        e.preventDefault();
        
        const users = DB.get('users');
        const index = users.findIndex(u => u.id === studentId);
        
        if (index !== -1) {
            users[index].name = document.getElementById('editStudentName').value.trim();
            users[index].class = document.getElementById('editStudentClass').value.trim();
            users[index].major = document.getElementById('editStudentMajor').value.trim();
            
            DB.set('users', users);
            
            this.closeEduModal();
            this.showEduToast('✅ 修改成功');
            this.renderEduAdminStudents();
        }
    },

    deleteStudent(studentId) {
        if (!confirm(`确定要删除学号为 ${studentId} 的学生吗？\n\n注意：该学生的选课记录也将被删除。`)) return;
        
        // 删除用户
        let users = DB.get('users');
        users = users.filter(u => u.id !== studentId);
        DB.set('users', users);
        
        // 删除选课记录
        let enrollments = DB.get('enrollments');
        enrollments = enrollments.filter(e => e.studentId !== studentId);
        DB.set('enrollments', enrollments);
        
        // 删除作业提交
        if (typeof DB.get('submissions') !== 'undefined') {
            let submissions = DB.get('submissions');
            submissions = submissions.filter(s => s.studentId !== studentId);
            DB.set('submissions', submissions);
        }
        
        this.showEduToast('✅ 删除成功');
        this.renderEduAdminStudents();
    },

    importStudentsDemo() {
        if (!confirm('模拟批量导入学生数据（将添加10名测试学生）？')) return;
        
        const users = DB.get('users');
        const timestamp = Date.now();
        const newStudents = [];
        
        for (let i = 1; i <= 10; i++) {
            const id = `S${timestamp}${String(i).padStart(3, '0')}`;
            newStudents.push({
                id: id,
                name: `测试学生${i}`,
                role: 'student',
                email: `${id.toLowerCase()}@szu.edu.cn`,
                class: '2024级计算机1班',
                major: '计算机科学与技术',
                passwordHash: btoa(id + 'password'),
                salt: id,
                loginAttempts: 0,
                lockUntil: 0
            });
        }
        
        users.push(...newStudents);
        DB.set('users', users);
        
        this.showEduToast(`✅ 成功导入${newStudents.length}名学生`);
        this.renderEduAdminStudents();
    },

    // ==================== 教师管理 ====================
    renderEduAdminTeachers() {
        this.updateEduAdminNav('nav-edu-teachers');
        
        const teachers = DB.get('users').filter(u => u.role === 'teacher');
        const courses = DB.get('courses');
        
        const html = `
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">教师列表</h3>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="teacherSearchInput" placeholder="搜索工号/姓名..." 
                            style="padding:8px; border:1px solid #ddd; border-radius:4px; width:200px;"
                            oninput="app.searchEduTeachers(this.value)">
                        <button class="btn btn-primary" onclick="app.showAddTeacherModal()">添加教师</button>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:15%">工号</th>
                            <th style="width:15%">姓名</th>
                            <th style="width:25%">邮箱</th>
                            <th style="width:15%">授课数</th>
                            <th style="width:30%">操作</th>
                        </tr>
                    </thead>
                    <tbody id="teachersTableBody">
                        ${this.renderTeacherRows(teachers, courses)}
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('eduAdminContent').innerHTML = html;
    },

    renderTeacherRows(teachers, courses) {
        if (teachers.length === 0) {
            return '<tr><td colspan="5" style="text-align:center; padding:40px; color:#888;">暂无教师数据</td></tr>';
        }
        
        return teachers.map(t => {
            const courseCount = courses.filter(c => c.teacherId === t.id).length;
            return `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.name}</td>
                    <td>${t.email || '-'}</td>
                    <td>${courseCount}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding:4px 12px; font-size:12px;" onclick="app.viewTeacherCourses('${t.id}')">查看课程</button>
                        <button class="btn btn-secondary" style="padding:4px 12px; font-size:12px;" onclick="app.editTeacher('${t.id}')">编辑</button>
                        <button class="btn btn-danger" style="padding:4px 12px; font-size:12px;" onclick="app.deleteTeacher('${t.id}')">删除</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    searchEduTeachers(keyword) {
        const allTeachers = DB.get('users').filter(u => u.role === 'teacher');
        const courses = DB.get('courses');
        
        const filtered = allTeachers.filter(t => 
            t.id.toLowerCase().includes(keyword.toLowerCase()) ||
            t.name.toLowerCase().includes(keyword.toLowerCase()) ||
            (t.email && t.email.toLowerCase().includes(keyword.toLowerCase()))
        );
        
        document.getElementById('teachersTableBody').innerHTML = this.renderTeacherRows(filtered, courses);
    },

    viewTeacherCourses(teacherId) {
        const teacher = DB.get('users').find(u => u.id === teacherId);
        const courses = DB.get('courses').filter(c => c.teacherId === teacherId);
        
        const modalContent = `
            <h4 style="margin-bottom:15px;">${teacher.name}（${teacherId}）的授课列表</h4>
            ${courses.length > 0 ? `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>课程号</th>
                            <th>课程名</th>
                            <th>学分</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${courses.map(c => `
                            <tr>
                                <td>${c.id}</td>
                                <td>${c.name}</td>
                                <td>${c.credit}</td>
                                <td>${c.status === 'published' ? '已发布' : '草稿'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top:15px; color:#666; font-size:14px;">
                    授课总数：<strong>${courses.length}</strong>门
                </div>
            ` : '<div style="text-align:center; padding:40px; color:#888;">该教师暂未承担课程</div>'}
        `;
        
        this.showEduModal('教师授课列表', modalContent);
    },

    showAddTeacherModal() {
        const modalContent = `
            <form onsubmit="app.handleAddTeacher(event)">
                <div class="form-group">
                    <label class="form-label">工号</label>
                    <input type="text" id="newTeacherId" class="form-input" required placeholder="例如：T999">
                </div>
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input type="text" id="newTeacherName" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">邮箱</label>
                    <input type="email" id="newTeacherEmail" class="form-input" placeholder="可选">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">添加教师</button>
            </form>
        `;
        
        this.showEduModal('添加教师', modalContent);
    },

    handleAddTeacher(e) {
        e.preventDefault();
        
        const users = DB.get('users');
        const newId = document.getElementById('newTeacherId').value.trim();
        
        if (users.find(u => u.id === newId)) {
            alert('工号已存在！');
            return;
        }
        
        const newTeacher = {
            id: newId,
            name: document.getElementById('newTeacherName').value.trim(),
            role: 'teacher',
            email: document.getElementById('newTeacherEmail').value.trim() || `${newId.toLowerCase()}@szu.edu.cn`,
            passwordHash: btoa(newId + 'password'),
            salt: newId,
            loginAttempts: 0,
            lockUntil: 0
        };
        
        users.push(newTeacher);
        DB.set('users', users);
        
        this.closeEduModal();
        this.showEduToast('✅ 添加成功');
        this.renderEduAdminTeachers();
    },

    editTeacher(teacherId) {
        const teacher = DB.get('users').find(u => u.id === teacherId);
        if (!teacher) return;
        
        const modalContent = `
            <form onsubmit="app.handleEditTeacher(event, '${teacherId}')">
                <div class="form-group">
                    <label class="form-label">工号</label>
                    <input type="text" class="form-input" value="${teacher.id}" readonly style="background:#f5f5f5;">
                </div>
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input type="text" id="editTeacherName" class="form-input" value="${teacher.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">邮箱</label>
                    <input type="email" id="editTeacherEmail" class="form-input" value="${teacher.email || ''}">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">保存修改</button>
            </form>
        `;
        
        this.showEduModal('编辑教师信息', modalContent);
    },

    handleEditTeacher(e, teacherId) {
        e.preventDefault();
        
        const users = DB.get('users');
        const index = users.findIndex(u => u.id === teacherId);
        
        if (index !== -1) {
            users[index].name = document.getElementById('editTeacherName').value.trim();
            users[index].email = document.getElementById('editTeacherEmail').value.trim();
            
            // 同步更新课程中的教师名称
            const courses = DB.get('courses');
            courses.forEach(c => {
                if (c.teacherId === teacherId) {
                    c.teacherName = users[index].name;
                }
            });
            DB.set('courses', courses);
            
            DB.set('users', users);
            
            this.closeEduModal();
            this.showEduToast('✅ 修改成功');
            this.renderEduAdminTeachers();
        }
    },

    deleteTeacher(teacherId) {
        const courses = DB.get('courses').filter(c => c.teacherId === teacherId);
        
        if (courses.length > 0) {
            alert(`该教师还有${courses.length}门课程，请先处理这些课程！`);
            return;
        }
        
        if (!confirm(`确定要删除工号为 ${teacherId} 的教师吗？`)) return;
        
        let users = DB.get('users');
        users = users.filter(u => u.id !== teacherId);
        DB.set('users', users);
        
        this.showEduToast('✅ 删除成功');
        this.renderEduAdminTeachers();
    },

    // ==================== 课程管理 ====================
    renderEduAdminCourses() {
        this.updateEduAdminNav('nav-edu-courses');
        
        const courses = DB.get('courses');
        const enrollments = DB.get('enrollments');
        
        const html = `
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">课程列表</h3>
                    <input type="text" id="courseSearchInput" placeholder="搜索课程..." 
                        style="padding:8px; border:1px solid #ddd; border-radius:4px; width:200px;"
                        oninput="app.searchEduCourses(this.value)">
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:12%">课程号</th>
                            <th style="width:25%">课程名</th>
                            <th style="width:15%">教师</th>
                            <th style="width:8%">学分</th>
                            <th style="width:12%">选课人数</th>
                            <th style="width:12%">状态</th>
                            <th style="width:16%">操作</th>
                        </tr>
                    </thead>
                    <tbody id="coursesTableBody">
                        ${this.renderCourseRows(courses, enrollments)}
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('eduAdminContent').innerHTML = html;
    },

    renderCourseRows(courses, enrollments) {
        if (courses.length === 0) {
            return '<tr><td colspan="7" style="text-align:center; padding:40px; color:#888;">暂无课程数据</td></tr>';
        }
        
        return courses.map(c => {
            const studentCount = enrollments.filter(e => e.courseId === c.id).length;
            return `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>${c.teacherName}</td>
                    <td>${c.credit}</td>
                    <td>${studentCount}</td>
                    <td><span class="tag ${c.status === 'published' ? 'tag-success' : 'tag-warning'}">${c.status === 'published' ? '已发布' : '草稿'}</span></td>
                    <td>
                        <button class="btn btn-secondary" style="padding:4px 12px; font-size:12px;" onclick="app.viewCourseStudents('${c.id}')">学生名单</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    searchEduCourses(keyword) {
        const allCourses = DB.get('courses');
        const enrollments = DB.get('enrollments');
        
        const filtered = allCourses.filter(c => 
            c.id.toLowerCase().includes(keyword.toLowerCase()) ||
            c.name.toLowerCase().includes(keyword.toLowerCase()) ||
            c.teacherName.toLowerCase().includes(keyword.toLowerCase())
        );
        
        document.getElementById('coursesTableBody').innerHTML = this.renderCourseRows(filtered, enrollments);
    },

    viewCourseStudents(courseId) {
        const course = DB.get('courses').find(c => c.id === courseId);
        const enrollments = DB.get('enrollments').filter(e => e.courseId === courseId);
        const users = DB.get('users');
        
        const students = enrollments.map(e => {
            const student = users.find(u => u.id === e.studentId);
            return {
                ...student,
                grade: e.grade
            };
        });
        
        const modalContent = `
            <h4 style="margin-bottom:15px;">${course.name}（${courseId}）选课学生名单</h4>
            ${students.length > 0 ? `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>学号</th>
                            <th>姓名</th>
                            <th>班级</th>
                            <th>成绩</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => `
                            <tr>
                                <td>${s.id}</td>
                                <td>${s.name}</td>
                                <td>${s.class || '未分配'}</td>
                                <td>${s.grade !== null ? s.grade : '未录入'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top:15px; color:#666; font-size:14px;">
                    选课人数：<strong>${students.length}</strong>人 | 
                    已录成绩：<strong>${students.filter(s => s.grade !== null).length}</strong>人
                </div>
            ` : '<div style="text-align:center; padding:40px; color:#888;">该课程暂无学生选课</div>'}
        `;
        
        this.showEduModal('选课学生名单', modalContent);
    },

    // ==================== 班级管理 ====================
    renderEduAdminClasses() {
        this.updateEduAdminNav('nav-edu-classes');
        
        const students = DB.get('users').filter(u => u.role === 'student');
        
        // 从学生数据中提取班级信息
        const classMap = new Map();
        students.forEach(s => {
            if (s.class && s.class.trim()) {
                if (!classMap.has(s.class)) {
                    classMap.set(s.class, {
                        name: s.class,
                        major: s.major || '未知专业',
                        students: []
                    });
                }
                classMap.get(s.class).students.push(s);
            }
        });
        
        const classes = Array.from(classMap.values());
        
        const html = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">班级管理</h3></div>
                ${classes.length > 0 ? `
                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px; padding:20px;">
                        ${classes.map(cls => `
                            <div style="border:1px solid #e5e5e5; border-radius:8px; padding:20px; background:#fafafa;">
                                <h4 style="margin:0 0 10px 0; font-size:18px;">${cls.name}</h4>
                                <div style="color:#666; font-size:14px; margin-bottom:15px;">
                                    专业：${cls.major}<br>
                                    学生人数：<strong style="color:#0066cc;">${cls.students.length}</strong>人
                                </div>
                                <button class="btn btn-secondary" style="width:100%;" onclick="app.viewClassDetail('${cls.name}')">查看详情</button>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div style="text-align:center; padding:60px; color:#888;">暂无班级数据</div>'}
            </div>
        `;
        
        document.getElementById('eduAdminContent').innerHTML = html;
    },

    viewClassDetail(className) {
        const students = DB.get('users').filter(u => u.role === 'student' && u.class === className);
        
        const modalContent = `
            <h4 style="margin-bottom:15px;">${className} 学生名单</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>学号</th>
                        <th>姓名</th>
                        <th>专业</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => `
                        <tr>
                            <td>${s.id}</td>
                            <td>${s.name}</td>
                            <td>${s.major || '未知'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top:15px; color:#666; font-size:14px;">
                班级人数：<strong>${students.length}</strong>人
            </div>
        `;
        
        this.showEduModal('班级详情', modalContent);
    },

    // ==================== 排课管理 ====================
    renderEduAdminSchedules() {
        this.updateEduAdminNav('nav-edu-schedules');
        
        const courses = DB.get('courses').filter(c => c.status === 'published');
        const enrollments = DB.get('enrollments');
        
        const html = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">排课管理（基于课程时间信息）</h3></div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:15%">课程号</th>
                            <th style="width:25%">课程名</th>
                            <th style="width:15%">教师</th>
                            <th style="width:15%">上课时间</th>
                            <th style="width:15%">教室</th>
                            <th style="width:15%">选课人数</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${courses.map(c => {
                            const count = enrollments.filter(e => e.courseId === c.id).length;
                            return `
                                <tr>
                                    <td>${c.id}</td>
                                    <td>${c.name}</td>
                                    <td>${c.teacherName}</td>
                                    <td>${c.schedule || '未排课'}</td>
                                    <td>${c.classroom || '未分配'}</td>
                                    <td>${count}</td>
                                </tr>
                            `;
                        }).join('')}
                        ${courses.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">暂无已发布课程</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
            
            <div class="card" style="margin-top:20px;">
                <div class="card-header"><h3 class="card-title">课程表预览</h3></div>
                <div style="overflow-x:auto; padding:20px;">
                    ${this.generateSchedulePreview(courses)}
                </div>
            </div>
        `;
        
        document.getElementById('eduAdminContent').innerHTML = html;
    },

    generateSchedulePreview(courses) {
        const weekdays = ['周一', '周二', '周三', '周四', '周五'];
        const periods = ['1-2节', '3-4节', '5-6节', '7-8节'];
        
        let html = '<table class="data-table" style="min-width:600px;">';
        html += '<thead><tr><th style="width:100px;">时间</th>';
        weekdays.forEach(day => {
            html += `<th>${day}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        periods.forEach(period => {
            html += `<tr><td><strong>${period}</strong></td>`;
            weekdays.forEach(day => {
                const course = courses.find(c => c.schedule === `${day} ${period}`);
                if (course) {
                    html += `<td style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:12px;">
                        <div style="font-weight:600; margin-bottom:4px;">${course.name}</div>
                        <div style="font-size:11px; opacity:0.9;">${course.teacherName}</div>
                        <div style="font-size:11px; opacity:0.9;">${course.classroom || '-'}</div>
                    </td>`;
                } else {
                    html += '<td style="background:#f9f9f9;"></td>';
                }
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
    },

    // ==================== 成绩审核 ====================
    renderEduAdminGrades() {
        this.updateEduAdminNav('nav-edu-grades');
        
        const courses = DB.get('courses');
        const enrollments = DB.get('enrollments');
        
        // 按课程统计成绩
        const gradeStats = courses.map(c => {
            const courseEnrollments = enrollments.filter(e => e.courseId === c.id);
            const gradedEnrollments = courseEnrollments.filter(e => e.grade !== null);
            
            const grades = gradedEnrollments.map(e => e.grade);
            const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : '-';
            const excellentCount = grades.filter(g => g >= 85).length;
            const passCount = grades.filter(g => g >= 60).length;
            const excellentRate = grades.length > 0 ? (excellentCount / grades.length * 100).toFixed(1) : '0.0';
            const passRate = grades.length > 0 ? (passCount / grades.length * 100).toFixed(1) : '0.0';
            
            // 异常检测
            const isAnomalousExcellent = parseFloat(excellentRate) >= 70;
            const isAnomalousPass = parseFloat(passRate) < 60 && grades.length > 0;
            const isAnomaly = isAnomalousExcellent || isAnomalousPass;
            
            return {
                ...c,
                totalStudents: courseEnrollments.length,
                gradedStudents: gradedEnrollments.length,
                avgGrade,
                excellentRate,
                passRate,
                isAnomaly,
                anomalyReason: isAnomalousExcellent ? '优秀率过高' : (isAnomalousPass ? '及格率过低' : '')
            };
        });
        
        const anomalyCount = gradeStats.filter(s => s.isAnomaly).length;
        
        const html = `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:20px;">
                <div class="card" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color:white; padding:20px;">
                    <div style="font-size:14px; opacity:0.9; margin-bottom:8px;">异常课程数</div>
                    <div style="font-size:36px; font-weight:bold;">${anomalyCount}</div>
                </div>
            </div>
        
            <div class="card">
                <div class="card-header"><h3 class="card-title">成绩审核与异常监控</h3></div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:12%">课程号</th>
                            <th style="width:20%">课程名</th>
                            <th style="width:12%">教师</th>
                            <th style="width:10%">人数</th>
                            <th style="width:10%">平均分</th>
                            <th style="width:10%">优秀率</th>
                            <th style="width:10%">及格率</th>
                            <th style="width:16%">状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gradeStats.map(s => {
                            const rowStyle = s.isAnomaly ? 'background:#fff3cd;' : '';
                            return `
                                <tr style="${rowStyle}">
                                    <td>${s.id}</td>
                                    <td>${s.name}</td>
                                    <td>${s.teacherName}</td>
                                    <td>${s.gradedStudents}/${s.totalStudents}</td>
                                    <td><strong>${s.avgGrade}</strong></td>
                                    <td>${s.excellentRate}%</td>
                                    <td>${s.passRate}%</td>
                                    <td>
                                        ${s.isAnomaly 
                                            ? `<span class="tag tag-warning">⚠️ ${s.anomalyReason}</span>` 
                                            : '<span class="tag tag-success">正常</span>'}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        ${gradeStats.length === 0 ? '<tr><td colspan="8" style="text-align:center; padding:40px; color:#888;">暂无课程数据</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
            
            ${anomalyCount > 0 ? `
                <div class="card" style="margin-top:20px; border:1px solid #ffc107; background:#fffbf0;">
                    <div class="card-header" style="background:#fff3cd;"><h3 class="card-title" style="color:#856404;">⚠️ 异常提示</h3></div>
                    <div style="padding:20px; color:#856404;">
                        <p>检测到 <strong>${anomalyCount}</strong> 门课程存在成绩异常：</p>
                        <ul style="margin:10px 0; padding-left:20px;">
                            <li>优秀率过高（≥70%）可能需要审核评分标准</li>
                            <li>及格率过低（<60%）建议核查教学质量</li>
                        </ul>
                        <p style="margin-top:15px;">建议教学管理员对异常课程进行重点审核。</p>
                    </div>
                </div>
            ` : ''}
        `;
        
        document.getElementById('eduAdminContent').innerHTML = html;
    },

    // ==================== 通用工具方法 ====================
    showEduModal(title, contentHTML) {
        const oldModal = document.getElementById('edu-modal');
        if (oldModal) oldModal.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'edu-modal';
        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 1000;
            display: flex; justify-content: center; align-items: center;
        `;
        
        modalOverlay.innerHTML = `
            <div style="background:white; width:600px; max-width:90%; max-height:80vh; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.2); overflow:hidden; animation: slideDown 0.3s;">
                <div style="padding:15px 20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
                    <h3 style="margin:0; font-size:18px; color:#333;">${title}</h3>
                    <button onclick="app.closeEduModal()" style="border:none; background:none; font-size:24px; cursor:pointer; color:#666; line-height:1;">&times;</button>
                </div>
                <div style="padding:20px; max-height:60vh; overflow-y:auto;">
                    ${contentHTML}
                </div>
            </div>
            <style>@keyframes slideDown { from {opacity:0; transform:translateY(-20px);} to {opacity:1; transform:translateY(0);} }</style>
        `;
        
        document.body.appendChild(modalOverlay);
        
        modalOverlay.addEventListener('click', (e) => {
            if(e.target === modalOverlay) this.closeEduModal();
        });
    },

    closeEduModal() {
        const modal = document.getElementById('edu-modal');
        if (modal) modal.remove();
    }
});

// 添加必要的CSS样式
const eduAdminStyles = `
.tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}
.tag-success {
    background: #f0fdf4;
    color: #34c759;
}
.tag-warning {
    background: #fff3cd;
    color: #856404;
}
.tag-danger {
    background: #ffebee;
    color: #b71c1c;
}
`;

if (!document.getElementById('edu-admin-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'edu-admin-styles';
    styleSheet.innerText = eduAdminStyles;
    document.head.appendChild(styleSheet);
}

