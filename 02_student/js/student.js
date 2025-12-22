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
            <div style="background:white; width:500px; max-width:90%; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.2); overflow:hidden; animation: slideDown 0.3s;">
                <div style="padding:15px 20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
                    <h3 style="margin:0; font-size:18px; color:#333;">${title}</h3>
                    <button onclick="document.getElementById('app-modal').remove()" style="border:none; background:none; font-size:20px; cursor:pointer; color:#666;">&times;</button>
                </div>
                <div style="padding:20px; max-height:70vh; overflow-y:auto;">
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

    // --- 修改：查看课件 (使用弹窗显示老师上传的课件) ---
    viewCourseMaterials(courseId, courseName) {
        const course = DB.get('courses').find(c => c.id === courseId);
        // 如果老师没传，显示默认兜底数据
        const materials = (course.materials && course.materials.length > 0) 
            ? course.materials 
            : [
                { name: '课程大纲.pdf (示例)', date: '2024-09-01' },
                { name: '第一章：导论.pptx (示例)', date: '2024-09-08' }
              ]; 

        const listHTML = materials.map(m => `
            <div style="display:flex; align-items:center; padding:12px; border-bottom:1px solid #f0f0f0;">
                <div style="font-size:24px; margin-right:15px;">📄</div>
                <div style="flex:1;">
                    <div style="font-weight:bold; color:#333;">${m.name}</div>
                    <div style="font-size:12px; color:#888;">上传时间: ${m.date || '未知'}</div>
                </div>
                <button class="btn btn-sm" style="background:#e3f2fd; color:#0277bd;" onclick="alert('模拟下载：${m.name}')">下载</button>
            </div>
        `).join('');

        this.showModal(`📖 学习资料 - ${courseName}`, `
            <div style="margin-bottom:10px; color:#666; font-size:13px;">以下是教师发布的课程资料：</div>
            ${listHTML}
        `);
    },

    // --- 修改：提交作业 (显示要求 + 文件上传) ---
    handleHomework(courseId, courseName) {
        const course = DB.get('courses').find(c => c.id === courseId);
        const enrollment = DB.get('enrollments').find(e => e.courseId === courseId && e.studentId === this.state.currentUser.id);
        
        const assignmentReq = course.assignmentReq || "教师暂未发布具体的作业文本说明，请以上课通知为准。";
        const submittedFile = enrollment.submission; 

        let statusHTML = '';
        if (submittedFile) {
            statusHTML = `
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:10px; border-radius:4px; margin-bottom:15px;">
                    <strong>✅ 已提交</strong><br>
                    文件名: ${submittedFile.fileName}<br>
                    提交时间: ${submittedFile.date}
                </div>
            `;
        } else {
            statusHTML = `
                <div style="background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; padding:10px; border-radius:4px; margin-bottom:15px;">
                    <strong>⚠️ 未提交</strong><br>请尽快完成作业并上传。
                </div>
            `;
        }

        const formHTML = `
            ${statusHTML}
            <div style="margin-bottom:15px;">
                <label style="display:block; font-weight:bold; margin-bottom:5px;">📢 作业要求：</label>
                <div style="background:#f9fafb; padding:10px; border-radius:4px; font-size:14px; color:#444; line-height:1.5;">
                    ${assignmentReq.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div style="margin-bottom:20px;">
                <label style="display:block; font-weight:bold; margin-bottom:5px;">📤 上传作业文件：</label>
                <input type="file" id="homework_file_input" class="form-input" style="padding:8px;">
                <div style="font-size:12px; color:#888; margin-top:5px;">支持 .zip, .doc, .pdf 格式，最大 10MB</div>
            </div>

            <div style="text-align:right;">
                <button class="btn btn-primary" onclick="app.submitHomeworkFile('${courseId}')">确认提交</button>
            </div>
        `;

        this.showModal(`📝 提交作业 - ${courseName}`, formHTML);
    },

    // --- 新增：处理上传 ---
    submitHomeworkFile(courseId) {
        const fileInput = document.getElementById('homework_file_input');
        if (!fileInput || fileInput.files.length === 0) {
            alert('请先选择一个文件！');
            return;
        }

        const file = fileInput.files[0];
        
        // 模拟上传
        const enrollments = DB.get('enrollments');
        const idx = enrollments.findIndex(e => e.courseId === courseId && e.studentId === this.state.currentUser.id);
        
        if (idx !== -1) {
            enrollments[idx].submission = {
                fileName: file.name,
                fileSize: (file.size / 1024).toFixed(1) + ' KB',
                date: new Date().toLocaleString()
            };
            
            DB.set('enrollments', enrollments);
            
            document.getElementById('app-modal').remove();
            this.showToast(`✅ 作业 "${file.name}" 上传成功！`);
            this.renderStudentMyCourses(); // 刷新状态
        }
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
    // 模块 3：成绩单
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