// --- START OF FILE student.js ---

// 1. 定义样式
const studentStyles = `
/* --- 核心修复：固定表格布局 (防止搜索抖动) --- */
.data-table {
    table-layout: fixed;
    width: 100%;
    border-collapse: collapse;
}

/* 单元格样式 */
.data-table th, 
.data-table td {
    text-align: center !important;
    vertical-align: middle !important;
    padding: 12px 8px;
    border-bottom: 1px solid #eee;
    
    /* 防止内容溢出 */
    white-space: nowrap; 
    overflow: hidden;
    text-overflow: ellipsis; 
}

/* 表头美化 */
.data-table th {
    background-color: #f9fafb;
    color: #4b5563;
    font-weight: 600;
}

/* 按钮容器居中 */
.action-buttons {
    display: flex;
    justify-content: center !important;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
}

/* 状态胶囊 */
.status-done { color: #34c759; background:#f0fdf4; padding:2px 8px; border-radius:12px; font-size:12px; font-weight:600; }
.status-ongoing { color: #0066cc; background:#f0f9ff; padding:2px 8px; border-radius:12px; font-size:12px; font-weight:600; }

/* 按钮基础样式 */
.btn-sm {
    font-size: 12px;
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid transparent; /* 预留边框位置 */
    cursor: pointer;
    transition: all 0.2s;
}
.btn-sm:hover { opacity: 0.8; }

/* --- 新增：成绩单按钮点击高亮样式 --- */
.btn-active-grade {
    background-color: #e3f2fd !important; /* 浅蓝色背景 */
    color: #0066cc !important;           /* 深蓝色文字 */
    border-color: #0066cc !important;    /* 深蓝色边框 */
    font-weight: bold;
}

/* 搜索框样式 */
#courseSearchInput:focus {
    outline: 2px solid #0066cc;
    border-radius: 4px;
}

/* 学期选择下拉框样式 */
.semester-select {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    outline: none;
}
.semester-select:focus {
    border-color: #0066cc;
}
`;

Object.assign(app, {
    readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
            reader.readAsDataURL(file);
        });
    },

    downloadDataUrl(dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        a.remove();
    },

    formatBytes(bytes) {
        const n = Number(bytes) || 0;
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    },

    getCourseById(courseId) {
        return DB.get('courses').find(c => c.id === courseId);
    },

    saveCourse(updatedCourse) {
        const courses = DB.get('courses');
        const idx = courses.findIndex(c => c.id === updatedCourse.id);
        if (idx !== -1) {
            courses[idx] = updatedCourse;
            DB.set('courses', courses);
        }
    },

    getSubmissions() {
        return DB.get('submissions');
    },

    setSubmissions(submissions) {
        DB.set('submissions', submissions);
    },

    // 2. 初始化入口
    renderStudentDashboard() {
        this.injectStudentStyles();

        const container = document.getElementById('app');
        container.innerHTML = `
            <h2 style="margin-bottom:20px;">学生工作台</h2>
            
            <div style="display:flex; gap:20px; margin-bottom:20px;">
                <button id="nav-my-courses" class="btn btn-primary" onclick="app.renderStudentMyCourses()">我的课程</button>
                <button id="nav-all-courses" class="btn btn-secondary" onclick="app.renderStudentAllCourses()">选课中心</button>
                <button id="nav-grades" class="btn btn-secondary" onclick="app.renderStudentGrades()">成绩单</button>
            </div>
            
            <div id="studentContent"></div>
        `;
        
        // 恢复页面状态
        const lastTab = localStorage.getItem('student_last_tab');
        if (lastTab === 'all-courses') {
            this.renderStudentAllCourses();
        } else if (lastTab === 'grades') {
            this.renderStudentGrades();
        } else {
            this.renderStudentMyCourses();
        }
    },

    injectStudentStyles() {
        if (!document.getElementById('student-inline-style')) {
            const styleSheet = document.createElement("style");
            styleSheet.id = 'student-inline-style';
            styleSheet.innerText = studentStyles;
            document.head.appendChild(styleSheet);
        }
    },

    updateStudentNav(activeId) {
        const navIds = ['nav-my-courses', 'nav-all-courses', 'nav-grades'];
        navIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.className = id === activeId ? 'btn btn-primary' : 'btn btn-secondary';
        });
    },

    // --- 新增：通用弹窗辅助函数 ---
    showModal(title, contentHTML) {
        const oldModal = document.getElementById('app-modal');
        if (oldModal) oldModal.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'app-modal';
        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 1000;
            display: flex; justify-content: center; align-items: center;
        `;
        
        modalOverlay.innerHTML = `
            <div style="background:white; width:600px; max-width:95%; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.2); overflow:hidden; animation: slideDown 0.3s;">
                <div style="padding:15px 20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
                    <h3 style="margin:0; font-size:18px; color:#333;">${title}</h3>
                    <button onclick="document.getElementById('app-modal').remove()" style="border:none; background:none; font-size:20px; cursor:pointer; color:#666;">&times;</button>
                </div>
                <div style="padding:20px; max-height:80vh; overflow-y:auto;">
                    ${contentHTML}
                </div>
            </div>
            <style>@keyframes slideDown { from {opacity:0; transform:translateY(-20px);} to {opacity:1; transform:translateY(0);} }</style>
        `;
        
        document.body.appendChild(modalOverlay);
        
        modalOverlay.addEventListener('click', (e) => {
            if(e.target === modalOverlay) modalOverlay.remove();
        });
    },

    // =========================================
    // 模块 1：我的课程
    // =========================================
    renderStudentMyCourses() {
        localStorage.setItem('student_last_tab', 'my-courses');
        this.updateStudentNav('nav-my-courses');

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
                    <thead>
                        <tr>
                            <th style="width: 15%">课程号</th>
                            <th style="width: 25%">课程名</th>
                            <th style="width: 15%">教师</th>
                            <th style="width: 10%">学分</th>
                            <th style="width: 15%">状态</th>
                            <th style="width: 20%">学习任务</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${myCourses.map(c => `
                            <tr>
                                <td>${c.id}</td>
                                <td>${c.name}</td>
                                <td>${c.teacherName}</td>
                                <td>${c.credit}</td>
                                <td><span class="${c.grade ? 'status-done' : 'status-ongoing'}">${c.grade ? '已结课' : '进行中'}</span></td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm" style="background-color:#e3f2fd; color:#0d47a1;" 
                                            onclick="app.viewCourseMaterials('${c.id}', '${c.name}')">📖 查看课件</button>
                                        <button class="btn btn-sm" style="background-color:#fff3e0; color:#e65100;" 
                                            onclick="app.handleHomework('${c.id}', '${c.name}')">📝 提交作业</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    },

    viewCourseMaterials(courseId, courseName) {
        const course = this.getCourseById(courseId);
        const materials = (course && Array.isArray(course.materials)) ? course.materials : [];

        const html = `
            <button class="btn btn-secondary" onclick="app.renderStudentMyCourses()" style="margin-bottom:20px;">&larr; 返回我的课程</button>
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">课件列表 - ${courseName}</h3>
                    <div style="color:#666; font-size:13px;">共 ${materials.length} 份课件</div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 45%">文件名</th>
                            <th style="width: 15%">大小</th>
                            <th style="width: 20%">发布时间</th>
                            <th style="width: 20%">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${materials.map(m => `
                            <tr>
                                <td title="${m.name || ''}">${m.name || '-'}</td>
                                <td>${this.formatBytes(m.size)}</td>
                                <td>${m.uploadedAt || '-'}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm" style="background-color:#e3f2fd; color:#0d47a1;"
                                            onclick="app.downloadCourseMaterial('${courseId}', '${m.id}')">下载</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                        ${materials.length === 0 ? `<tr><td colspan="4" style="color:#999; padding:20px;">暂无课件</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    },

    downloadCourseMaterial(courseId, materialId) {
        const course = this.getCourseById(courseId);
        const materials = (course && Array.isArray(course.materials)) ? course.materials : [];
        const material = materials.find(m => m && m.id === materialId);
        if (!material || !material.dataUrl) {
            alert('课件不存在或数据缺失');
            return;
        }
        this.downloadDataUrl(material.dataUrl, material.name || `material-${materialId}`);
    },

    handleHomework(courseId, courseName) {
        const course = this.getCourseById(courseId);
        const assignmentReq = (course && typeof course.assignmentReq === 'string' && course.assignmentReq.trim())
            ? course.assignmentReq.trim()
            : '教师暂未发布具体的作业文本说明，请以上课通知为准。';

        const studentId = this.state.currentUser.id;
        const submissions = this.getSubmissions();
        const current = submissions.find(s => s && s.courseId === courseId && s.studentId === studentId);

        const statusHTML = current
            ? `
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:10px; border-radius:4px; margin-bottom:15px;">
                    <strong>✅ 已提交</strong><br>
                    文件名: ${current.fileName}<br>
                    提交时间: ${current.uploadedAt}
                </div>
            `
            : `
                <div style="background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; padding:10px; border-radius:4px; margin-bottom:15px;">
                    <strong>⚠️ 未提交</strong><br>请尽快完成作业并上传。
                </div>
            `;

        const html = `
            <button class="btn btn-secondary" onclick="app.renderStudentMyCourses()" style="margin-bottom:20px;">&larr; 返回我的课程</button>
            <div class="card">
                <div class="card-header"><h3 class="card-title">作业提交 - ${courseName}</h3></div>

                ${statusHTML}

                <div style="margin-bottom:15px;">
                    <div style="font-weight:600; margin-bottom:6px;"> 作业要求</div>
                    <div style="background:#f9fafb; padding:10px; border-radius:4px; font-size:14px; color:#444; line-height:1.5;">
                        ${assignmentReq.replace(/\n/g, '<br>')}
                    </div>
                </div>

                <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:16px;">
                    <input type="file" id="studentHomeworkFile" class="form-input" style="max-width:420px; padding: 8px 12px;">
                    <button class="btn btn-primary" onclick="app.submitStudentHomework('${courseId}')">上传作业</button>
                    <div style="color:#666; font-size:13px;">建议文件不超过 2MB</div>
                </div>

                <div style="color:#111; font-weight:600; margin-bottom:10px;">已提交记录</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 50%">文件名</th>
                            <th style="width: 15%">大小</th>
                            <th style="width: 20%">提交时间</th>
                            <th style="width: 15%">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${current ? `
                            <tr>
                                <td title="${current.fileName || ''}">${current.fileName || '-'}</td>
                                <td>${this.formatBytes(current.fileSize)}</td>
                                <td>${current.uploadedAt || '-'}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm" style="background-color:#e3f2fd; color:#0d47a1;"
                                            onclick="app.downloadStudentHomework('${current.id}')">下载</button>
                                        <button class="btn btn-sm" style="background-color:#ffebee; color:#b71c1c;"
                                            onclick="app.removeStudentHomework('${current.id}', '${courseId}', '${courseName}')">删除</button>
                                    </div>
                                </td>
                            </tr>
                        ` : `<tr><td colspan="4" style="color:#999; padding:20px;">暂无已提交作业</td></tr>`}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    },

    async submitStudentHomework(courseId) {
        const input = document.getElementById('studentHomeworkFile');
        if (!input || !input.files || input.files.length === 0) {
            alert('请选择要上传的作业文件');
            return;
        }

        const file = input.files[0];
        if (file.size > 2 * 1024 * 1024) {
            alert('文件过大（超过 2MB），请更换较小文件');
            return;
        }

        let dataUrl = '';
        try {
            dataUrl = await this.readFileAsDataUrl(file);
        } catch (e) {
            alert(e && e.message ? e.message : '读取文件失败');
            return;
        }

        const studentId = this.state.currentUser.id;
        const submissions = this.getSubmissions();
        const now = new Date().toLocaleString();
        const idx = submissions.findIndex(s => s && s.courseId === courseId && s.studentId === studentId);

        const record = {
            id: idx !== -1 ? submissions[idx].id : `SUB_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            courseId,
            studentId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            dataUrl,
            uploadedAt: now
        };

        if (idx !== -1) submissions[idx] = record;
        else submissions.push(record);

        this.setSubmissions(submissions);
        this.showToast('作业上传成功');

        const c = this.getCourseById(courseId);
        this.handleHomework(courseId, c ? c.name : courseId);
    },

    downloadStudentHomework(submissionId) {
        const submissions = this.getSubmissions();
        const record = submissions.find(s => s && s.id === submissionId && s.studentId === this.state.currentUser.id);
        if (!record || !record.dataUrl) {
            alert('作业不存在或数据缺失');
            return;
        }
        this.downloadDataUrl(record.dataUrl, record.fileName || `homework-${submissionId}`);
    },

    removeStudentHomework(submissionId, courseId, courseName) {
        if (!confirm('确定删除已提交的作业吗？')) return;
        const submissions = this.getSubmissions();
        const next = submissions.filter(s => !(s && s.id === submissionId && s.studentId === this.state.currentUser.id));
        this.setSubmissions(next);
        this.showToast('已删除作业');
        this.handleHomework(courseId, courseName);
    },

    // =========================================
    // 模块 2：选课中心
    // =========================================
    renderStudentAllCourses(searchTerm = '') {
        localStorage.setItem('student_last_tab', 'all-courses');
        this.updateStudentNav('nav-all-courses');

        let courses = DB.get('courses').filter(c => c.status === 'published');
        
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            courses = courses.filter(c => 
                c.name.toLowerCase().includes(lowerTerm) || 
                c.id.toLowerCase().includes(lowerTerm) ||
                c.teacherName.toLowerCase().includes(lowerTerm)
            );
        }

        const enrollments = DB.get('enrollments').filter(e => e.studentId === this.state.currentUser.id);
        const enrolledIds = enrollments.map(e => e.courseId);

        const html = `
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">选课中心</h3>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="courseSearchInput" placeholder="搜索课程/教师..." value="${searchTerm}" 
                            style="padding:5px; border:1px solid #ddd; border-radius:4px; width:200px;" 
                            onkeyup="if(event.key === 'Enter') app.renderStudentAllCourses(this.value)">
                        <button class="btn btn-primary" onclick="app.renderStudentAllCourses(document.getElementById('courseSearchInput').value)">搜索</button>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 15%">课程号</th>
                            <th style="width: 30%">课程名</th>
                            <th style="width: 15%">教师</th>
                            <th style="width: 20%">时间</th>
                            <th style="width: 20%">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${courses.length > 0 ? courses.map(c => {
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
                        }).join('') : '<tr><td colspan="5" style="color:#999; padding:20px;">未找到匹配的课程</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('studentContent').innerHTML = html;
        
        const inputEl = document.getElementById('courseSearchInput');
        if(inputEl && searchTerm) {
            inputEl.focus();
            inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
        }
    },

    enrollCourse(courseId) {
        if (!confirm('确定要选修这门课程吗？')) return;

        const enrollments = DB.get('enrollments');
        if(enrollments.some(e => e.studentId === this.state.currentUser.id && e.courseId === courseId)) {
            this.showToast('您已选修该课程');
            return;
        }

        enrollments.push({
            studentId: this.state.currentUser.id,
            courseId: courseId,
            grade: null,
            details: { homework: null, midterm: null, final: null }
        });
        DB.set('enrollments', enrollments);
        this.showToast('选课成功！');
        
        const currentSearch = document.getElementById('courseSearchInput') ? document.getElementById('courseSearchInput').value : '';
        this.renderStudentAllCourses(currentSearch);
    },

    // =========================================
    // 模块 3：成绩单 (含全校成绩统计与趋势图)
    // =========================================
    calculateGPA(grade) {
        if (!grade) return 0.0;
        const score = parseFloat(grade);
        if (score >= 90) return 4.0;
        if (score >= 85) return 3.7;
        if (score >= 82) return 3.3;
        if (score >= 78) return 3.0;
        if (score >= 75) return 2.7;
        if (score >= 72) return 2.3;
        if (score >= 68) return 2.0;
        if (score >= 64) return 1.5;
        if (score >= 60) return 1.0;
        return 0.0;
    },

    renderStudentGrades(selectedSemester = null) {
        localStorage.setItem('student_last_tab', 'grades');
        this.updateStudentNav('nav-grades');

        const enrollments = DB.get('enrollments').filter(e => e.studentId === this.state.currentUser.id && e.grade !== null);
        const courses = DB.get('courses');

        // 1. 整理所有成绩数据
        const allGradeData = enrollments.map(e => {
            const c = courses.find(course => course.id === e.courseId);
            const semester = (c && c.semester) ? c.semester : '2024秋季';
            return { 
                ...c, 
                grade: e.grade, 
                details: e.details,
                semester: semester
            };
        });

        // 2. 计算所有学期的汇总数据 (总学分、总平均绩点)
        let allSemCredits = 0;
        let allSemPoints = 0;
        allGradeData.forEach(d => {
            const gpa = this.calculateGPA(d.grade);
            const credit = parseFloat(d.credit || 0);
            allSemCredits += credit;
            allSemPoints += gpa * credit;
        });
        const allAvgGPA = allSemCredits > 0 ? (allSemPoints / allSemCredits).toFixed(2) : "0.00";

        // 3. 提取学期列表并处理当前学期筛选
        const uniqueSemesters = [...new Set(allGradeData.map(d => d.semester))].sort().reverse();
        
        if (!selectedSemester && uniqueSemesters.length > 0) {
            selectedSemester = uniqueSemesters[0];
        } else if (!selectedSemester) {
            selectedSemester = '2024秋季';
        }

        const filteredData = allGradeData.filter(d => d.semester === selectedSemester);

        // 4. 计算当前选中学期的统计数据
        let currentSemCredits = 0;
        let currentSemPoints = 0;
        
        const gradeRows = filteredData.map(row => {
            const gpa = this.calculateGPA(row.grade);
            const credit = parseFloat(row.credit || 0);
            
            currentSemCredits += credit;
            currentSemPoints += gpa * credit;

            return { ...row, gpa: gpa };
        });

        const currentSemAvgGPA = currentSemCredits > 0 ? (currentSemPoints / currentSemCredits).toFixed(2) : "0.00";

        const html = `
            <!-- 总览卡片 -->
            <div class="card" style="margin-bottom:20px; background: linear-gradient(to right, #e3f2fd, #f8fafc); border-left: 5px solid #0066cc;">
                <div style="padding:15px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="margin:0 0 5px 0; color:#0d47a1;">🎓 学业总进度</h3>
                        <div style="color:#555; font-size:14px;">在校期间所有课程统计</div>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:14px; color:#666; margin-right:15px;">累计修读学分: <strong style="font-size:18px; color:#333;">${allSemCredits}</strong></span>
                        <span style="font-size:14px; color:#666;">总平均绩点(GPA): <strong style="font-size:18px; color:#e65100;">${allAvgGPA}</strong></span>
                    </div>
                </div>
            </div>

            <!-- 学期成绩列表 -->
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <h3 class="card-title" style="margin:0;">学期成绩单</h3>
                        <select class="semester-select" onchange="app.renderStudentGrades(this.value)">
                            ${uniqueSemesters.map(sem => 
                                `<option value="${sem}" ${sem === selectedSemester ? 'selected' : ''}>${sem}</option>`
                            ).join('')}
                            ${uniqueSemesters.length === 0 ? `<option value="2024秋季">2024秋季</option>` : ''}
                        </select>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center;">
                         <button class="btn btn-primary" onclick="app.showGradeTrendChart()" style="display:flex; align-items:center; gap:5px;">
                            📊 查看成绩趋势图
                        </button>
                        <div style="background:#f9fafb; padding:6px 12px; border-radius:4px; font-size:13px; color:#666; border:1px solid #eee;">
                            本学期绩点: <strong style="color:#0066cc;">${currentSemAvgGPA}</strong>
                        </div>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 15%">学期</th>
                            <th style="width: 25%">课程名</th>
                            <th style="width: 10%">学分</th>
                            <th style="width: 15%">总成绩</th>
                            <th style="width: 10%">绩点</th>
                            <th style="width: 25%">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gradeRows.length > 0 ? gradeRows.map(row => `
                            <tr>
                                <td>${row.semester}</td>
                                <td>${row.name}</td>
                                <td>${row.credit}</td>
                                <td style="font-weight:bold; color:#333;">${row.grade}</td>
                                <td>${row.gpa.toFixed(1)}</td>
                                <td>
                                    <button id="btn-grade-${row.id}" class="btn btn-sm grade-action-btn" 
                                        style="background-color:#f3f4f6; border:1px solid #ddd; color:#374151;"
                                        onclick="app.viewGradeDetails('${row.id}', '${row.name}')">
                                        查看明细
                                    </button>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="6" style="color:#999; padding:20px;">该学期暂无成绩记录</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div id="gradeDetailsArea" style="margin-top:20px;"></div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    },

    // --- 新增：展示成绩趋势图 (SVG) ---
    showGradeTrendChart() {
        const enrollments = DB.get('enrollments').filter(e => e.studentId === this.state.currentUser.id && e.grade !== null);
        const courses = DB.get('courses');

        // 1. 聚合每学期数据
        const semStats = {};
        enrollments.forEach(e => {
            const c = courses.find(course => course.id === e.courseId);
            const sem = (c && c.semester) ? c.semester : '未知学期';
            const gpa = this.calculateGPA(e.grade);
            const credit = parseFloat((c && c.credit) || 0);

            if (!semStats[sem]) semStats[sem] = { totalPoints: 0, totalCredits: 0 };
            semStats[sem].totalPoints += gpa * credit;
            semStats[sem].totalCredits += credit;
        });

        // 2. 转换为数组并排序 (从早到晚)
        const sortedData = Object.keys(semStats).map(sem => {
            const d = semStats[sem];
            const avg = d.totalCredits > 0 ? (d.totalPoints / d.totalCredits) : 0;
            return { semester: sem, gpa: avg };
        }).sort((a, b) => {
            // 解析年份 "2023秋季" -> 2023
            const yearA = parseInt(a.semester) || 0;
            const yearB = parseInt(b.semester) || 0;
            if (yearA !== yearB) return yearA - yearB;
            // 同一年，春季在秋季前
            const isSpringA = a.semester.includes('春');
            const isSpringB = b.semester.includes('春');
            if (isSpringA && !isSpringB) return -1;
            if (!isSpringA && isSpringB) return 1;
            return 0;
        });

        if (sortedData.length === 0) {
            alert('暂无成绩数据，无法生成图表');
            return;
        }

        // 3. 生成 SVG 图表
        const width = 550;
        const height = 300;
        const padding = 40;
        const chartW = width - padding * 2;
        const chartH = height - padding * 2;

        // Y轴比例：最大绩点4.0，留点头部空间设为 4.5
        const maxGPA = 4.5;
        const getY = (gpa) => height - padding - (gpa / maxGPA) * chartH;
        
        // X轴比例
        const getX = (index) => padding + (index * (chartW / (Math.max(1, sortedData.length - 1))));

        // 构建路径点
        let pointsStr = '';
        const circles = sortedData.map((d, i) => {
            const x = sortedData.length === 1 ? width / 2 : getX(i); // 只有一个点时居中
            const y = getY(d.gpa);
            if (i === 0) pointsStr += `${x},${y}`;
            else pointsStr += ` ${x},${y}`;
            
            return `<circle cx="${x}" cy="${y}" r="5" fill="#0066cc" stroke="white" stroke-width="2">
                        <title>${d.semester}: ${d.gpa.toFixed(2)}</title>
                    </circle>
                    <text x="${x}" y="${y - 10}" font-size="12" text-anchor="middle" fill="#0066cc" font-weight="bold">${d.gpa.toFixed(2)}</text>
                    <text x="${x}" y="${height - padding + 20}" font-size="12" text-anchor="middle" fill="#555">${d.semester}</text>`;
        }).join('');

        const svgContent = `
            <div style="text-align:center;">
                <svg width="${width}" height="${height}" style="background:white; border-radius:4px;">
                    <!-- 坐标轴 -->
                    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ddd" stroke-width="1" />
                    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ddd" stroke-width="1" />
                    
                    <!-- Y轴刻度 -->
                    <text x="${padding - 10}" y="${getY(4.0)}" font-size="10" text-anchor="end" fill="#999">4.0</text>
                    <text x="${padding - 10}" y="${getY(2.0)}" font-size="10" text-anchor="end" fill="#999">2.0</text>
                    <text x="${padding - 10}" y="${height - padding}" font-size="10" text-anchor="end" fill="#999">0</text>
                    
                    <!-- 折线 -->
                    <polyline points="${pointsStr}" fill="none" stroke="#0066cc" stroke-width="2" />
                    
                    <!-- 数据点和文字 -->
                    ${circles}
                </svg>
                <div style="margin-top:10px; color:#666; font-size:12px;">X轴：学期 (时间顺序) / Y轴：平均绩点</div>
            </div>
        `;

        this.showModal('📈 成绩变化趋势 (从早到晚)', svgContent);
    },

    viewGradeDetails(courseId, courseName) {
        // 高亮逻辑
        document.querySelectorAll('.grade-action-btn').forEach(btn => {
            btn.classList.remove('btn-active-grade');
            btn.style.backgroundColor = '#f3f4f6';
            btn.style.color = '#374151';
            btn.style.borderColor = '#ddd';
        });

        const activeBtn = document.getElementById(`btn-grade-${courseId}`);
        if (activeBtn) {
            activeBtn.classList.add('btn-active-grade');
        }

        // 显示详情
        const enrollment = DB.get('enrollments').find(e => e.studentId === this.state.currentUser.id && e.courseId === courseId);
        if (!enrollment) return;
        const d = enrollment.details;
        
        document.getElementById('gradeDetailsArea').innerHTML = `
            <div class="card" style="border:1px solid #eee; box-shadow:0 4px 6px rgba(0,0,0,0.05); animation: fadeIn 0.3s;">
                <div class="card-header" style="background:#fafafa;"><h4 style="margin:0;">📝 ${courseName} 成绩明细</h4></div>
                <div style="padding:20px; display:grid; grid-template-columns:repeat(3,1fr); gap:20px; text-align:center;">
                    <div style="background:#f9f9f9; padding:15px; border-radius:8px;"><div>平时</div><div style="font-size:1.5em; font-weight:bold; color:#0066cc;">${d.homework||'-'}</div></div>
                    <div style="background:#f9f9f9; padding:15px; border-radius:8px;"><div>期中</div><div style="font-size:1.5em; font-weight:bold; color:#0066cc;">${d.midterm||'-'}</div></div>
                    <div style="background:#f9f9f9; padding:15px; border-radius:8px;"><div>期末</div><div style="font-size:1.5em; font-weight:bold; color:#e65100;">${d.final||'-'}</div></div>
                </div>
            </div>`;
        
        const style = document.createElement('style');
        style.innerHTML = `@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`;
        document.head.appendChild(style);

        document.getElementById('gradeDetailsArea').scrollIntoView({ behavior: 'smooth' });
    }
});