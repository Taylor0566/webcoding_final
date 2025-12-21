// --- START OF FILE student.js ---

// 1. 定义样式 (新增 .btn-active-grade 样式)
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
`;

Object.assign(app, {
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
        alert(`正在打开【${courseName}】的学习资源...`);
    },

    handleHomework(courseId, courseName) {
        const input = prompt(`请输入【${courseName}】的作业内容：`);
        if (input) this.showToast('作业提交成功！');
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
    // 模块 3：成绩单 (添加了按钮高亮逻辑)
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

    renderStudentGrades() {
        localStorage.setItem('student_last_tab', 'grades');
        this.updateStudentNav('nav-grades');

        const enrollments = DB.get('enrollments').filter(e => e.studentId === this.state.currentUser.id && e.grade !== null);
        const courses = DB.get('courses');

        let totalCredits = 0;
        let totalPoints = 0;
        
        const gradeRows = enrollments.map(e => {
            const c = courses.find(course => course.id === e.courseId);
            const gpa = this.calculateGPA(e.grade);
            const credit = parseFloat(c.credit);
            
            totalCredits += credit;
            totalPoints += gpa * credit;

            return { ...c, grade: e.grade, gpa: gpa, details: e.details };
        });

        const avgGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

        const html = `
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">学期成绩总览</h3>
                    <div style="background:#f0f9ff; padding:8px 15px; border-radius:4px; color:#0288d1; font-weight:bold;">
                        总学分: ${totalCredits} &nbsp;|&nbsp; 平均绩点: ${avgGPA}
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
                        ${gradeRows.map(row => `
                            <tr>
                                <td>2024秋季</td>
                                <td>${row.name}</td>
                                <td>${row.credit}</td>
                                <td style="font-weight:bold; color:#333;">${row.grade}</td>
                                <td>${row.gpa.toFixed(1)}</td>
                                <td>
                                    <!-- 添加 id 和 class 方便 JS 选择 -->
                                    <button id="btn-grade-${row.id}" class="btn btn-sm grade-action-btn" 
                                        style="background-color:#f3f4f6; border:1px solid #ddd; color:#374151;"
                                        onclick="app.viewGradeDetails('${row.id}', '${row.name}')">
                                        查看明细
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="gradeDetailsArea" style="margin-top:20px;"></div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    },

    viewGradeDetails(courseId, courseName) {
        // --- 1. 高亮逻辑 ---
        // 移除所有按钮的高亮类，恢复默认样式
        document.querySelectorAll('.grade-action-btn').forEach(btn => {
            btn.classList.remove('btn-active-grade');
            btn.style.backgroundColor = '#f3f4f6'; // 恢复默认灰色
            btn.style.color = '#374151';
            btn.style.borderColor = '#ddd';
        });

        // 激活当前按钮
        const activeBtn = document.getElementById(`btn-grade-${courseId}`);
        if (activeBtn) {
            activeBtn.classList.add('btn-active-grade');
            // 必须清除内联样式，才能让 CSS class 生效 (或者 CSS 中使用 !important)
            // 这里我们已经 CSS 加了 !important，所以直接添加 class 即可
        }

        // --- 2. 显示详情 ---
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
        
        // 简单的淡入动画
        const style = document.createElement('style');
        style.innerHTML = `@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`;
        document.head.appendChild(style);

        document.getElementById('gradeDetailsArea').scrollIntoView({ behavior: 'smooth' });
    }
});