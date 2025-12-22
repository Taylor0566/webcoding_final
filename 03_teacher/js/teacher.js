// --- START OF FILE teacher.js ---

Object.assign(app, {
    ensureTeacherFileUtils() {
        if (typeof this.readFileAsDataUrl !== 'function') {
            this.readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
                reader.readAsDataURL(file);
            });
        }
        if (typeof this.downloadDataUrl !== 'function') {
            this.downloadDataUrl = (dataUrl, filename) => {
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = filename || 'download';
                document.body.appendChild(a);
                a.click();
                a.remove();
            };
        }
        if (typeof this.formatBytes !== 'function') {
            this.formatBytes = (bytes) => {
                const n = Number(bytes) || 0;
                if (n < 1024) return `${n} B`;
                if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
                return `${(n / (1024 * 1024)).toFixed(1)} MB`;
            };
        }
    },

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

    // --- 新增：教师端使用的弹窗函数 ---
    showTeacherModal(title, contentHTML) {
        const oldModal = document.getElementById('teacher-modal');
        if (oldModal) oldModal.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'teacher-modal';
        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 1000;
            display: flex; justify-content: center; align-items: center;
        `;
        
        modalOverlay.innerHTML = `
            <div style="background:white; width:600px; max-width:95%; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.2); overflow:hidden; animation: slideDown 0.3s;">
                <div style="padding:15px 20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
                    <h3 style="margin:0; font-size:18px; color:#333;">${title}</h3>
                    <button onclick="document.getElementById('teacher-modal').remove()" style="border:none; background:none; font-size:20px; cursor:pointer; color:#666;">&times;</button>
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

    renderTeacherDashboard() {
        this.ensureTeacherCourseViewState();
        this.ensureTeacherFileUtils();
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
                                        <button class="btn btn-secondary" onclick="app.renderTeacherMaterials('${c.id}')">课件</button>
                                        <button class="btn btn-secondary" onclick="app.renderTeacherSubmissions('${c.id}')">作业</button>
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

    // --- 成绩录入 (保持不变) ---
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

    // --- 课件管理 (保持不变) ---
    renderTeacherMaterials(courseId) {
        this.ensureTeacherFileUtils();
        const course = DB.get('courses').find(c => c.id === courseId);
        if (!course) {
            alert('课程不存在');
            return;
        }

        const materials = Array.isArray(course.materials) ? course.materials : [];
        const html = `
            <button class="btn btn-secondary" onclick="app.renderTeacherDashboard()" style="margin-bottom:20px;">&larr; 返回课程列表</button>
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">课件管理 - ${course.name}</h3>
                    <div style="color:#666; font-size:13px;">共 ${materials.length} 份</div>
                </div>

                <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:16px;">
                    <input type="file" id="teacherMaterialFile" class="form-input" style="max-width:420px; padding: 8px 12px;">
                    <button class="btn btn-primary" onclick="app.uploadTeacherMaterial('${courseId}')">发布课件</button>
                    <div style="color:#666; font-size:13px;">建议文件不超过 2MB</div>
                </div>

                <table class="data-table">
                    <thead><tr><th style="width:45%;">文件名</th><th style="width:15%;">大小</th><th style="width:20%;">发布时间</th><th style="width:20%;">操作</th></tr></thead>
                    <tbody>
                        ${materials.map(m => `
                            <tr>
                                <td title="${m.name || ''}">${m.name || '-'}</td>
                                <td>${this.formatBytes(m.size)}</td>
                                <td>${m.uploadedAt || '-'}</td>
                                <td>
                                    <button class="btn btn-secondary" onclick="app.downloadTeacherMaterial('${courseId}', '${m.id}')">下载</button>
                                    <button class="btn btn-danger" onclick="app.deleteTeacherMaterial('${courseId}', '${m.id}')">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                        ${materials.length === 0 ? `<tr><td colspan="4" style="color:#888; padding:18px 12px;">暂无课件</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('teacherContent').innerHTML = html;
    },

    async uploadTeacherMaterial(courseId) {
        this.ensureTeacherFileUtils();
        const input = document.getElementById('teacherMaterialFile');
        if (!input || !input.files || input.files.length === 0) {
            alert('请选择要发布的课件文件');
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

        const courses = DB.get('courses');
        const idx = courses.findIndex(c => c.id === courseId);
        if (idx === -1) {
            alert('课程不存在');
            return;
        }

        const course = courses[idx];
        const materials = Array.isArray(course.materials) ? course.materials.slice() : [];
        materials.push({
            id: `MAT_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
            uploadedAt: new Date().toLocaleString(),
            uploaderId: this.state.currentUser.id
        });
        courses[idx] = { ...course, materials };
        DB.set('courses', courses);
        this.showToast('课件已发布');
        this.renderTeacherMaterials(courseId);
    },

    downloadTeacherMaterial(courseId, materialId) {
        this.ensureTeacherFileUtils();
        const course = DB.get('courses').find(c => c.id === courseId);
        const materials = (course && Array.isArray(course.materials)) ? course.materials : [];
        const material = materials.find(m => m && m.id === materialId);
        if (!material || !material.dataUrl) {
            alert('课件不存在或数据缺失');
            return;
        }
        this.downloadDataUrl(material.dataUrl, material.name || `material-${materialId}`);
    },

    deleteTeacherMaterial(courseId, materialId) {
        if (!confirm('确定删除该课件吗？')) return;
        const courses = DB.get('courses');
        const idx = courses.findIndex(c => c.id === courseId);
        if (idx === -1) return;
        const course = courses[idx];
        const materials = Array.isArray(course.materials) ? course.materials : [];
        const next = materials.filter(m => !(m && m.id === materialId));
        courses[idx] = { ...course, materials: next };
        DB.set('courses', courses);
        this.showToast('课件已删除');
        this.renderTeacherMaterials(courseId);
    },

    // --- 作业管理 (样式修复：按钮左右分布) ---
    renderTeacherSubmissions(courseId) {
        this.ensureTeacherFileUtils();
        const course = DB.get('courses').find(c => c.id === courseId);
        if (!course) { alert('课程不存在'); return; }

        // 获取该课程的所有作业任务
        const assignments = (DB.get('assignments') || []).filter(a => a.courseId === courseId);

        const html = `
            <button class="btn btn-secondary" onclick="app.renderTeacherDashboard()" style="margin-bottom:20px;">&larr; 返回课程列表</button>
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">作业管理 - ${course.name}</h3>
                    <button class="btn btn-primary" onclick="app.openCreateAssignmentModal('${courseId}')">＋ 布置新作业</button>
                </div>
                <table class="data-table">
                    <!-- 调整列宽：操作列加宽至25%，提交人数减至15% -->
                    <thead><tr><th style="width:30%;">作业标题</th><th style="width:30%;">发布时间</th><th style="width:15%;">提交人数</th><th style="width:25%;">操作</th></tr></thead>
                    <tbody>
                        ${assignments.map(a => {
                            // 计算该作业的提交人数
                            const subCount = (DB.get('submissions') || []).filter(s => s.assignmentId === a.id).length;
                            return `
                                <tr>
                                    <td>${a.title}</td>
                                    <td>${a.createdAt}</td>
                                    <td>${subCount} 人</td>
                                    <td>
                                        <!-- 修改点：添加 Flex 容器使按钮左右分布 -->
                                        <div style="display:flex; gap:10px; justify-content:center; align-items:center;">
                                            <button class="btn btn-secondary" onclick="app.renderAssignmentDetail('${courseId}', '${a.id}')">查看/批改</button>
                                            <button class="btn btn-danger" onclick="app.deleteAssignment('${a.id}', '${courseId}')">删除</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        ${assignments.length === 0 ? `<tr><td colspan="4" style="color:#888; padding:20px;">暂无发布的作业，点击右上角发布。</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('teacherContent').innerHTML = html;
    },

    // --- 弹窗：布置新作业 ---
    openCreateAssignmentModal(courseId) {
        const content = `
            <div class="form-group">
                <label class="form-label">作业标题</label>
                <input type="text" id="assign_title" class="form-input" placeholder="例如：期中大作业" required>
            </div>
            <div class="form-group">
                <label class="form-label">作业内容/要求</label>
                <textarea id="assign_content" class="form-input" rows="5" placeholder="请输入具体的作业要求..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">附件 (可选，如题目文档)</label>
                <input type="file" id="assign_file" class="form-input">
            </div>
            <button class="btn btn-primary" style="width:100%; margin-top:10px;" onclick="app.handleCreateAssignment('${courseId}')">确认发布</button>
        `;
        this.showTeacherModal('布置新作业', content);
    },

    async handleCreateAssignment(courseId) {
        const title = document.getElementById('assign_title').value;
        const content = document.getElementById('assign_content').value;
        const fileInput = document.getElementById('assign_file');

        if (!title) { alert('请输入作业标题'); return; }

        let attachment = null;
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            try {
                const dataUrl = await this.readFileAsDataUrl(file);
                attachment = {
                    name: file.name,
                    size: file.size,
                    dataUrl: dataUrl
                };
            } catch (e) {
                alert('读取附件失败');
                return;
            }
        }

        const assignments = DB.get('assignments') || [];
        const newAssign = {
            id: `ASSIGN_${Date.now()}`,
            courseId: courseId,
            title: title,
            content: content,
            attachment: attachment,
            createdAt: new Date().toLocaleString()
        };

        assignments.push(newAssign);
        DB.set('assignments', assignments);
        
        // 关闭弹窗并刷新列表
        document.getElementById('teacher-modal').remove();
        this.showToast('作业发布成功');
        this.renderTeacherSubmissions(courseId);
    },

    deleteAssignment(assignmentId, courseId) {
        if(!confirm('删除作业将同时删除所有学生的提交记录，确定吗？')) return;
        
        let assignments = DB.get('assignments') || [];
        assignments = assignments.filter(a => a.id !== assignmentId);
        DB.set('assignments', assignments);

        // 清理对应的提交
        let subs = DB.get('submissions') || [];
        subs = subs.filter(s => s.assignmentId !== assignmentId);
        DB.set('submissions', subs);

        this.renderTeacherSubmissions(courseId);
    },

    // --- 查看具体的作业提交情况并打分 ---
    renderAssignmentDetail(courseId, assignmentId) {
        const assignment = (DB.get('assignments') || []).find(a => a.id === assignmentId);
        if (!assignment) { alert('作业不存在'); return this.renderTeacherSubmissions(courseId); }
        
        const allSubs = DB.get('submissions') || [];
        // 筛选出属于该作业的提交
        const subs = allSubs.filter(s => s.assignmentId === assignmentId);
        const users = DB.get('users');

        const html = `
            <button class="btn btn-secondary" onclick="app.renderTeacherSubmissions('${courseId}')" style="margin-bottom:20px;">&larr; 返回作业列表</button>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">批改作业 - ${assignment.title}</h3>
                    <div style="font-size:13px; color:#666; margin-top:5px;">共 ${subs.length} 份提交</div>
                </div>
                <div style="background:#f9f9f9; padding:15px; border-radius:4px; margin-bottom:20px; font-size:14px; color:#444;">
                    <strong>作业要求：</strong><br>${assignment.content || '无文字内容'}
                    ${assignment.attachment ? `<div style="margin-top:8px;"><a href="javascript:;" onclick="app.downloadDataUrl('${assignment.attachment.dataUrl}', '${assignment.attachment.name}')" style="color:#0066cc;">📎 下载附件: ${assignment.attachment.name}</a></div>` : ''}
                </div>

                <table class="data-table">
                    <thead><tr><th>学号</th><th>姓名</th><th>提交文件</th><th>提交时间</th><th>评分</th><th>操作</th></tr></thead>
                    <tbody>
                        ${subs.map(s => {
                            const u = users.find(x => x && x.id === s.studentId);
                            return `
                                <tr>
                                    <td>${s.studentId}</td>
                                    <td>${u ? u.name : '-'}</td>
                                    <td><a href="javascript:;" onclick="app.downloadTeacherSubmission('${s.id}')" style="color:#0066cc; text-decoration:underline;">${s.fileName}</a></td>
                                    <td>${s.uploadedAt}</td>
                                    <td>
                                        <input type="number" id="score_${s.id}" value="${s.score || ''}" style="width:60px; padding:4px; border:1px solid #ddd; border-radius:4px;" placeholder="0-100">
                                    </td>
                                    <td>
                                        <button class="btn btn-primary btn-sm" onclick="app.saveSubmissionScore('${s.id}')">保存评分</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        ${subs.length === 0 ? `<tr><td colspan="6" style="color:#888; padding:20px;">暂无学生提交</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('teacherContent').innerHTML = html;
    },

    downloadTeacherSubmission(submissionId) {
        this.ensureTeacherFileUtils();
        const subs = DB.get('submissions');
        const record = subs.find(s => s && s.id === submissionId);
        if (!record || !record.dataUrl) {
            alert('作业不存在或数据缺失');
            return;
        }
        this.downloadDataUrl(record.dataUrl, record.fileName || `homework-${submissionId}`);
    },

    saveSubmissionScore(submissionId) {
        const scoreInput = document.getElementById(`score_${submissionId}`);
        const score = scoreInput.value;
        if (score === '') return;

        const subs = DB.get('submissions') || [];
        const idx = subs.findIndex(s => s.id === submissionId);
        if (idx !== -1) {
            subs[idx].score = score;
            DB.set('submissions', subs);
            this.showToast('评分已保存');
        }
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
            classroom: document.getElementById('new_classroom').value,
            materials: []
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
        if (!course) {
            alert('课程不存在');
            return;
        }

        const materialsCount = Array.isArray(course.materials) ? course.materials.length : 0;
        
        const html = `
            <button class="btn btn-secondary" onclick="app.renderTeacherDashboard()" style="margin-bottom:20px;">&larr; 返回</button>
            <div class="card">
                <div class="card-header"><h3 class="card-title">编辑课程 - ${course.name}</h3></div>
                <form onsubmit="app.handleUpdateCourse(event, '${courseId}')">
                    <div class="form-group">
                        <label class="form-label">课程简介</label>
                        <textarea id="edit_desc" class="form-input" rows="3">${course.desc || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">上课时间</label>
                        <input type="text" id="edit_schedule" class="form-input" value="${course.schedule || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">教室</label>
                        <input type="text" id="edit_classroom" class="form-input" value="${course.classroom || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">课程资源</label>
                        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                            <button type="button" class="btn btn-secondary" onclick="app.renderTeacherMaterials('${courseId}')">管理课件（${materialsCount}）</button>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px;">保存所有修改</button>
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
            // 作业要求不再在此处保存
            
            DB.set('courses', courses);
            this.showToast('课程信息已更新');
            this.renderTeacherDashboard();
        }
    }
});