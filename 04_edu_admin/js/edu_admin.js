/**
 * 教学管理端核心逻辑
 * 完整实现教学管理功能（已修复所有问题）
 */

const eduAdmin = {
    // 数据存储键
    STORAGE_KEYS: {
        STUDENTS: 'edu_students',
        TEACHERS: 'edu_teachers',
        COURSES: 'edu_courses',
        CLASSES: 'edu_classes',
        SCHEDULES: 'edu_schedules',
        GRADES: 'edu_grades',
        PUBLISHED_GRADES: 'edu_published_grades',
        STUDENT_COURSES: 'edu_student_courses' // 学生选课记录
    },

    // 初始化
    init() {
        console.log('教学管理系统初始化...');
        this.initData();
        this.bindEvents();
        this.loadDashboard();
        this.loadStudents();
        this.showToast('欢迎使用教学管理系统！');
    },

    // 初始化模拟数据
    initData() {
        // 如果没有数据，初始化默认数据
        if (!localStorage.getItem(this.STORAGE_KEYS.STUDENTS)) {
            const students = [
                { id: 'S2021001', name: '张三', class: '计算机2101', major: '计算机科学与技术', year: 2021, status: '在读' },
                { id: 'S2021002', name: '李四', class: '计算机2101', major: '计算机科学与技术', year: 2021, status: '在读' },
                { id: 'S2021003', name: '王五', class: '计算机2102', major: '计算机科学与技术', year: 2021, status: '在读' },
                { id: 'S2021004', name: '赵六', class: '软件2101', major: '软件工程', year: 2021, status: '在读' },
                { id: 'S2021005', name: '钱七', class: '软件2101', major: '软件工程', year: 2021, status: '在读' },
                { id: 'S2022001', name: '孙八', class: '计算机2201', major: '计算机科学与技术', year: 2022, status: '在读' },
                { id: 'S2022002', name: '周九', class: '计算机2201', major: '计算机科学与技术', year: 2022, status: '在读' },
                { id: 'S2022003', name: '吴十', class: '数据2201', major: '数据科学与大数据技术', year: 2022, status: '在读' }
            ];
            localStorage.setItem(this.STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        }

        if (!localStorage.getItem(this.STORAGE_KEYS.TEACHERS)) {
            const teachers = [
                { id: 'T001', name: '王教授', title: '教授', department: '计算机学院', contact: '13800138001' },
                { id: 'T002', name: '李副教授', title: '副教授', department: '计算机学院', contact: '13800138002' },
                { id: 'T003', name: '张讲师', title: '讲师', department: '软件学院', contact: '13800138003' },
                { id: 'T004', name: '刘老师', title: '讲师', department: '数学学院', contact: '13800138004' }
            ];
            localStorage.setItem(this.STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
        }

        if (!localStorage.getItem(this.STORAGE_KEYS.COURSES)) {
            const courses = [
                { code: 'CS101', name: '数据结构与算法', credits: 4, hours: 64, department: '计算机学院', status: '开课中' },
                { code: 'CS102', name: 'Web前端开发', credits: 3, hours: 48, department: '计算机学院', status: '开课中' },
                { code: 'CS103', name: '数据库系统', credits: 4, hours: 64, department: '计算机学院', status: '开课中' },
                { code: 'SE101', name: '软件工程', credits: 3, hours: 48, department: '软件学院', status: '开课中' },
                { code: 'MA101', name: '高等数学', credits: 5, hours: 80, department: '数学学院', status: '开课中' }
            ];
            localStorage.setItem(this.STORAGE_KEYS.COURSES, JSON.stringify(courses));
        }

        if (!localStorage.getItem(this.STORAGE_KEYS.CLASSES)) {
            // 班级数据会根据实际学生数动态更新
            const classes = [
                { id: 'CLS001', name: '计算机2101', major: '计算机科学与技术', year: 2021 },
                { id: 'CLS002', name: '计算机2102', major: '计算机科学与技术', year: 2021 },
                { id: 'CLS003', name: '软件2101', major: '软件工程', year: 2021 },
                { id: 'CLS004', name: '计算机2201', major: '计算机科学与技术', year: 2022 },
                { id: 'CLS005', name: '数据2201', major: '数据科学与大数据技术', year: 2022 }
            ];
            localStorage.setItem(this.STORAGE_KEYS.CLASSES, JSON.stringify(classes));
        }

        // 排课数据初始化和迁移
        const existingSchedules = localStorage.getItem(this.STORAGE_KEYS.SCHEDULES);
        if (!existingSchedules) {
            // 首次初始化
            const schedules = [
                { id: 'SCH001', courseCode: 'CS101', courseName: '数据结构与算法', teacher: '王教授', time: '周一 1-2节', room: 'A101', capacity: 80, semester: '2024-2025-1' },
                { id: 'SCH002', courseCode: 'CS102', courseName: 'Web前端开发', teacher: '李副教授', time: '周二 3-4节', room: 'B202', capacity: 60, semester: '2024-2025-1' },
                { id: 'SCH003', courseCode: 'CS103', courseName: '数据库系统', teacher: '张讲师', time: '周三 5-6节', room: 'C303', capacity: 70, semester: '2024-2025-1' },
                { id: 'SCH004', courseCode: 'SE101', courseName: '软件工程', teacher: '李副教授', time: '周四 1-2节', room: 'A201', capacity: 60, semester: '2024-2025-1' },
                { id: 'SCH005', courseCode: 'MA101', courseName: '高等数学', teacher: '刘老师', time: '周五 3-4节', room: 'D401', capacity: 100, semester: '2024-2025-1' },
                // 第二学期的课程
                { id: 'SCH006', courseCode: 'CS101', courseName: '数据结构与算法', teacher: '王教授', time: '周一 1-2节', room: 'A101', capacity: 80, semester: '2024-2025-2' },
                { id: 'SCH007', courseCode: 'SE101', courseName: '软件工程', teacher: '张讲师', time: '周三 3-4节', room: 'B303', capacity: 70, semester: '2024-2025-2' }
            ];
            localStorage.setItem(this.STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
        } else {
            // 数据迁移：检查是否有旧数据没有semester字段
            const schedules = JSON.parse(existingSchedules);
            if (schedules.length > 0 && !schedules[0].semester) {
                console.log('检测到旧版排课数据，进行数据迁移...');
                // 将旧数据全部标记为第一学期
                schedules.forEach(s => {
                    if (!s.semester) {
                        s.semester = '2024-2025-1';
                    }
                });
                localStorage.setItem(this.STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
            }
            // 如果数据为空，重新初始化
            if (schedules.length === 0) {
                const newSchedules = [
                    { id: 'SCH001', courseCode: 'CS101', courseName: '数据结构与算法', teacher: '王教授', time: '周一 1-2节', room: 'A101', capacity: 80, semester: '2024-2025-1' },
                    { id: 'SCH002', courseCode: 'CS102', courseName: 'Web前端开发', teacher: '李副教授', time: '周二 3-4节', room: 'B202', capacity: 60, semester: '2024-2025-1' },
                    { id: 'SCH003', courseCode: 'CS103', courseName: '数据库系统', teacher: '张讲师', time: '周三 5-6节', room: 'C303', capacity: 70, semester: '2024-2025-1' },
                    { id: 'SCH004', courseCode: 'SE101', courseName: '软件工程', teacher: '李副教授', time: '周四 1-2节', room: 'A201', capacity: 60, semester: '2024-2025-1' },
                    { id: 'SCH005', courseCode: 'MA101', courseName: '高等数学', teacher: '刘老师', time: '周五 3-4节', room: 'D401', capacity: 100, semester: '2024-2025-1' },
                    { id: 'SCH006', courseCode: 'CS101', courseName: '数据结构与算法', teacher: '王教授', time: '周一 1-2节', room: 'A101', capacity: 80, semester: '2024-2025-2' },
                    { id: 'SCH007', courseCode: 'SE101', courseName: '软件工程', teacher: '张讲师', time: '周三 3-4节', room: 'B303', capacity: 70, semester: '2024-2025-2' }
                ];
                localStorage.setItem(this.STORAGE_KEYS.SCHEDULES, JSON.stringify(newSchedules));
            }
        }

        // 初始化成绩数据（用于异常监控演示）
        if (!localStorage.getItem(this.STORAGE_KEYS.GRADES)) {
            const grades = [
                {
                    courseCode: 'CS101',
                    courseName: '数据结构与算法',
                    teacher: '王教授',
                    studentCount: 65,
                    scores: [95, 92, 88, 90, 91, 93, 89, 94, 96, 87, 85, 90, 92, 88, 91, 93, 89, 90, 87, 86, 88, 90, 92, 94, 91, 89, 88, 90, 93, 91, 92, 90, 88, 87, 89, 91, 90, 88, 92, 93, 91, 89, 90, 88, 87, 90, 92, 91, 89, 88, 90, 93, 91, 89, 87, 90, 92, 88, 89, 91, 90, 88, 87, 89, 90],
                    published: false
                },
                {
                    courseCode: 'CS102',
                    courseName: 'Web前端开发',
                    teacher: '李副教授',
                    studentCount: 58,
                    scores: [78, 82, 75, 68, 72, 80, 76, 71, 79, 73, 77, 70, 74, 81, 69, 75, 78, 72, 76, 80, 74, 71, 77, 79, 73, 75, 78, 72, 76, 80, 74, 73, 77, 75, 78, 72, 76, 80, 74, 75, 77, 73, 78, 72, 76, 80, 74, 75, 77, 73, 78, 72, 76, 80, 74, 75, 77, 73],
                    published: false
                },
                {
                    courseCode: 'CS103',
                    courseName: '数据库系统',
                    teacher: '张讲师',
                    studentCount: 62,
                    scores: [45, 52, 48, 51, 47, 50, 49, 53, 46, 54, 48, 50, 52, 49, 47, 51, 48, 50, 49, 52, 47, 50, 48, 51, 49, 53, 47, 50, 48, 52, 49, 51, 47, 50, 48, 49, 52, 47, 50, 48, 51, 49, 47, 50, 48, 52, 49, 51, 47, 50, 48, 49, 52, 47, 50, 48, 51, 49, 47, 50, 48, 52],
                    published: false
                },
                {
                    courseCode: 'SE101',
                    courseName: '软件工程',
                    teacher: '李副教授',
                    studentCount: 55,
                    scores: [82, 85, 79, 83, 80, 84, 81, 86, 78, 82, 85, 80, 83, 79, 81, 84, 82, 80, 83, 85, 79, 81, 84, 82, 80, 83, 85, 79, 81, 84, 82, 80, 83, 85, 79, 81, 84, 82, 80, 83, 85, 79, 81, 84, 82, 80, 83, 85, 79, 81, 84, 82, 80, 83, 85],
                    published: false
                },
                {
                    courseCode: 'MA101',
                    courseName: '高等数学',
                    teacher: '刘老师',
                    studentCount: 85,
                    scores: Array(85).fill(0).map(() => Math.floor(Math.random() * 30) + 60),
                    published: false
                }
            ];
            localStorage.setItem(this.STORAGE_KEYS.GRADES, JSON.stringify(grades));
        }

        // 初始化学生历史成绩（用于学生异常监控）
        if (!localStorage.getItem('student_history_grades')) {
            const historyGrades = {
                // 成绩正常的学生
                'S2021001': { courses: ['CS101', 'CS102'], scores: [88, 85], average: 86.5 },
                
                // 成绩突然变好的学生（历史成绩低，本学期会高）
                'S2021002': { courses: ['CS101', 'CS102'], scores: [55, 58], average: 56.5 },  // 历史56.5 → 本学期78（+21.5）
                'S2021003': { courses: ['CS101'], scores: [62], average: 62 },  // 历史62 → 本学期85（+23）
                
                // 成绩突然下滑的学生（历史成绩高，本学期会低）
                'S2021004': { courses: ['SE101', 'MA101'], scores: [92, 90], average: 91 },  // 历史91 → 本学期68（-23）
                'S2021005': { courses: ['CS101', 'CS102'], scores: [88, 86], average: 87 },  // 历史87 → 本学期62（-25）
                
                // 更多测试数据
                'S2022001': { courses: ['MA101'], scores: [70], average: 70 },  // 历史70 → 本学期52（-18）
                'S2022002': { courses: ['CS102'], scores: [65], average: 65 },  // 历史65 → 本学期88（+23）
                'S2022003': { courses: ['CS101', 'MA101'], scores: [78, 80], average: 79 }  // 正常波动
            };
            localStorage.setItem('student_history_grades', JSON.stringify(historyGrades));
        }

        // 初始化学生选课记录（核心功能：每个学生自主选课）
        if (!localStorage.getItem(this.STORAGE_KEYS.STUDENT_COURSES)) {
            const studentCourses = {
                'S2021001': ['CS101', 'CS102', 'MA101'], // 张三选了3门课
                'S2021002': ['CS101', 'CS103', 'MA101'], // 李四选了3门课
                'S2021003': ['CS102', 'SE101'],           // 王五选了2门课
                'S2021004': ['SE101', 'MA101'],           // 赵六选了2门课
                'S2021005': ['CS101', 'CS102', 'CS103', 'SE101'], // 钱七选了4门课
                'S2022001': ['CS101', 'MA101'],           // 孙八选了2门课
                'S2022002': ['CS102', 'CS103'],           // 周九选了2门课
                'S2022003': ['CS101', 'CS102', 'MA101']   // 吴十选了3门课
            };
            localStorage.setItem(this.STORAGE_KEYS.STUDENT_COURSES, JSON.stringify(studentCourses));
        }
    },

    // 绑定事件
    bindEvents() {
        // 侧边栏导航
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                
                // 更新激活状态
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // 搜索功能
        document.getElementById('studentSearch')?.addEventListener('input', (e) => {
            this.searchStudents(e.target.value);
        });
        document.getElementById('teacherSearch')?.addEventListener('input', (e) => {
            this.searchTeachers(e.target.value);
        });
        document.getElementById('courseSearch')?.addEventListener('input', (e) => {
            this.searchCourses(e.target.value);
        });

        // 学期切换
        document.getElementById('semesterSelect')?.addEventListener('change', (e) => {
            this.loadScheduling();
        });

        // 退出登录
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('确定要退出登录吗？')) {
                // 清除登录状态
                localStorage.removeItem('currentUser');
                // 跳转到首页
                window.location.href = '../01_public_frontend_user_center/index.html';
            }
        });

        // 首页按钮和Logo点击
        const homeBtn = document.getElementById('homeBtn');
        const homeLogoBtn = document.getElementById('homeLogoBtn');
        
        homeBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            // 清除登录状态
            localStorage.removeItem('currentUser');
            // 跳转到首页
            window.location.href = '../01_public_frontend_user_center/index.html';
        });

        homeLogoBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            // 清除登录状态
            localStorage.removeItem('currentUser');
            // 跳转到首页
            window.location.href = '../01_public_frontend_user_center/index.html';
        });

        // 点击模态框外部关闭
        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.closeModal();
            }
        });
    },

    // 切换页面
    showSection(sectionId) {
        // 隐藏所有section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // 显示目标section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // 加载对应数据
            switch(sectionId) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'students':
                    this.loadStudents();
                    break;
                case 'teachers':
                    this.loadTeachers();
                    break;
                case 'courses':
                    this.loadCourses();
                    break;
                case 'classes':
                    this.loadClasses();
                    break;
                case 'scheduling':
                    this.loadScheduling();
                    break;
                case 'grades':
                    this.loadGrades();
                    break;
            }
        }
    },

    // 加载工作台数据
    loadDashboard() {
        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        const teachers = this.getData(this.STORAGE_KEYS.TEACHERS);
        const courses = this.getData(this.STORAGE_KEYS.COURSES);
        const grades = this.getData(this.STORAGE_KEYS.GRADES);
        
        document.getElementById('statStudents').textContent = students.length;
        document.getElementById('statTeachers').textContent = teachers.length;
        document.getElementById('statCourses').textContent = courses.length;
        
        const pendingGrades = grades.filter(g => !g.published).length;
        document.getElementById('statPendingGrades').textContent = pendingGrades;
    },

    // ==================== 学生管理 ====================
    
    // 加载学生列表
    loadStudents() {
        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        const studentCourses = this.getData(this.STORAGE_KEYS.STUDENT_COURSES);
        const tbody = document.getElementById('studentsTableBody');
        
        if (!tbody) return;
        
        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:#888;">暂无学生数据</td></tr>';
            return;
        }
        
        tbody.innerHTML = students.map(s => {
            const courseCount = (studentCourses[s.id] || []).length;
            return `
            <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.class}</td>
                <td>${s.major}</td>
                <td>${s.year}</td>
                <td><span class="tag tag-success">${s.status}</span></td>
                <td>
                    <button class="btn btn-primary" style="padding: 4px 12px; font-size: 12px; margin-right: 4px;" onclick="eduAdmin.viewStudentSchedule('${s.id}', '${s.name}')" title="查看该学生的个人课程表">📅 课程表(${courseCount})</button>
                    <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.editStudent('${s.id}')">编辑</button>
                    <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.deleteStudent('${s.id}')">删除</button>
                </td>
            </tr>
        `}).join('');
    },

    // 搜索学生
    searchStudents(query) {
        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        const studentCourses = this.getData(this.STORAGE_KEYS.STUDENT_COURSES);
        const filtered = students.filter(s => 
            s.id.toLowerCase().includes(query.toLowerCase()) ||
            s.name.toLowerCase().includes(query.toLowerCase())
        );
        
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = filtered.map(s => {
            const courseCount = (studentCourses[s.id] || []).length;
            return `
            <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.class}</td>
                <td>${s.major}</td>
                <td>${s.year}</td>
                <td><span class="tag tag-success">${s.status}</span></td>
                <td>
                    <button class="btn btn-primary" style="padding: 4px 12px; font-size: 12px; margin-right: 4px;" onclick="eduAdmin.viewStudentSchedule('${s.id}', '${s.name}')" title="查看该学生的个人课程表">📅 课程表(${courseCount})</button>
                    <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.editStudent('${s.id}')">编辑</button>
                    <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.deleteStudent('${s.id}')">删除</button>
                </td>
            </tr>
        `}).join('');
    },

    // 导入学生（模拟）
    importStudents() {
        if (confirm('模拟批量导入学生数据（将添加10名学生）？')) {
            const students = this.getData(this.STORAGE_KEYS.STUDENTS);
            const newStudents = Array(10).fill(0).map((_, i) => ({
                id: `S2024${String(i + 1).padStart(3, '0')}`,
                name: `学生${i + 1}`,
                class: '计算机2401',
                major: '计算机科学与技术',
                year: 2024,
                status: '在读'
            }));
            
            students.push(...newStudents);
            this.saveData(this.STORAGE_KEYS.STUDENTS, students);
            this.loadStudents();
            this.showToast('✅ 成功导入10名学生');
        }
    },

    // 编辑学生（新增）
    editStudent(id) {
        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        const student = students.find(s => s.id === id);
        
        if (!student) {
            alert('未找到该学生！');
            return;
        }

        document.getElementById('modalTitle').textContent = '编辑学生信息';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label class="form-label">学号</label>
                <input type="text" class="form-input" id="editStudentId" value="${student.id}" readonly style="background: #f5f5f5;">
                </div>
            <div class="form-group">
                <label class="form-label">姓名</label>
                <input type="text" class="form-input" id="editStudentName" value="${student.name}">
            </div>
            <div class="form-group">
                <label class="form-label">班级</label>
                <input type="text" class="form-input" id="editStudentClass" value="${student.class}">
            </div>
            <div class="form-group">
                <label class="form-label">专业</label>
                <input type="text" class="form-input" id="editStudentMajor" value="${student.major}">
            </div>
            <div class="form-group">
                <label class="form-label">入学年份</label>
                <input type="number" class="form-input" id="editStudentYear" value="${student.year}">
            </div>
            <div class="form-group">
                <label class="form-label">状态</label>
                <select class="form-input" id="editStudentStatus">
                    <option value="在读" ${student.status === '在读' ? 'selected' : ''}>在读</option>
                    <option value="休学" ${student.status === '休学' ? 'selected' : ''}>休学</option>
                    <option value="退学" ${student.status === '退学' ? 'selected' : ''}>退学</option>
                    <option value="毕业" ${student.status === '毕业' ? 'selected' : ''}>毕业</option>
                </select>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="eduAdmin.saveEditStudent()">保存</button>
            </div>
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 保存编辑的学生信息（新增）
    saveEditStudent() {
        const id = document.getElementById('editStudentId').value.trim();
        const name = document.getElementById('editStudentName').value.trim();
        const className = document.getElementById('editStudentClass').value.trim();
        const major = document.getElementById('editStudentMajor').value.trim();
        const year = parseInt(document.getElementById('editStudentYear').value);
        const status = document.getElementById('editStudentStatus').value;

        if (!name || !className || !major || !year) {
            alert('请填写完整信息！');
            return;
        }

        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        const index = students.findIndex(s => s.id === id);
        
        if (index !== -1) {
            students[index] = { id, name, class: className, major, year, status };
            this.saveData(this.STORAGE_KEYS.STUDENTS, students);
            
            this.closeModal();
            this.loadStudents();
            this.showToast('✅ 修改成功');
        }
    },

    // 删除学生
    deleteStudent(id) {
        if (confirm(`确定要删除学号为 ${id} 的学生吗？`)) {
            let students = this.getData(this.STORAGE_KEYS.STUDENTS);
            students = students.filter(s => s.id !== id);
            this.saveData(this.STORAGE_KEYS.STUDENTS, students);
            this.loadStudents();
            this.showToast('✅ 删除成功');
        }
    },

    // 添加学生模态框
    showAddStudentModal() {
        document.getElementById('modalTitle').textContent = '添加学生';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label class="form-label">学号</label>
                <input type="text" class="form-input" id="newStudentId" placeholder="例如：S2024001">
            </div>
            <div class="form-group">
                <label class="form-label">姓名</label>
                <input type="text" class="form-input" id="newStudentName" placeholder="请输入姓名">
            </div>
            <div class="form-group">
                <label class="form-label">班级</label>
                <input type="text" class="form-input" id="newStudentClass" placeholder="例如：计算机2101">
            </div>
            <div class="form-group">
                <label class="form-label">专业</label>
                <input type="text" class="form-input" id="newStudentMajor" placeholder="例如：计算机科学与技术">
            </div>
            <div class="form-group">
                <label class="form-label">入学年份</label>
                <input type="number" class="form-input" id="newStudentYear" placeholder="例如：2024" value="2024">
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="eduAdmin.saveNewStudent()">保存</button>
            </div>
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 保存新学生
    saveNewStudent() {
        const id = document.getElementById('newStudentId').value.trim();
        const name = document.getElementById('newStudentName').value.trim();
        const className = document.getElementById('newStudentClass').value.trim();
        const major = document.getElementById('newStudentMajor').value.trim();
        const year = parseInt(document.getElementById('newStudentYear').value);

        if (!id || !name || !className || !major || !year) {
            alert('请填写完整信息！');
            return;
        }

        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        
        // 检查学号是否已存在
        if (students.find(s => s.id === id)) {
            alert('该学号已存在！');
            return;
        }

        students.push({ id, name, class: className, major, year, status: '在读' });
        this.saveData(this.STORAGE_KEYS.STUDENTS, students);
        
        this.closeModal();
        this.loadStudents();
        this.showToast('✅ 添加成功');
    },

    // 查看学生个人课程表（核心功能：基于选课生成）
    viewStudentSchedule(studentId, studentName) {
        const studentCourses = this.getData(this.STORAGE_KEYS.STUDENT_COURSES);
        const selectedCourses = studentCourses[studentId] || [];
        const schedules = this.getData(this.STORAGE_KEYS.SCHEDULES);
        const courses = this.getData(this.STORAGE_KEYS.COURSES);

        // 获取该学生选的课程的上课时间
        const studentSchedules = schedules.filter(sch => 
            selectedCourses.includes(sch.courseCode)
        );

        document.getElementById('modalTitle').textContent = `${studentName}（${studentId}）的课程表`;
        
        if (studentSchedules.length === 0) {
            document.getElementById('modalBody').innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #888;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
                    <p style="font-size: 16px; margin-bottom: 8px;">该学生尚未选课</p>
                    <p style="font-size: 14px; color: #aaa;">请先让学生在学生端选课，或由教学管理员代为选课</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">关闭</button>
                    <button class="btn btn-primary" onclick="eduAdmin.manageStudentCourses('${studentId}', '${studentName}')">管理选课</button>
                </div>
            `;
        } else {
            // 生成课程表HTML
            const weekdays = ['周一', '周二', '周三', '周四', '周五'];
            const periods = ['1-2节', '3-4节', '5-6节', '7-8节'];

            let tableHTML = '<div style="overflow-x: auto; margin-bottom: 20px;"><table class="data-table" style="min-width: 600px;">';
            tableHTML += '<thead><tr><th style="width: 100px;">时间</th>';
            weekdays.forEach(day => {
                tableHTML += `<th>${day}</th>`;
            });
            tableHTML += '</tr></thead><tbody>';

            periods.forEach(period => {
                tableHTML += `<tr><td><strong>${period}</strong></td>`;
                weekdays.forEach(day => {
                    const course = studentSchedules.find(s => s.time === `${day} ${period}`);
                    if (course) {
                        tableHTML += `<td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px;">
                            <div style="font-weight: 600; margin-bottom: 4px;">${course.courseName}</div>
                            <div style="font-size: 11px; opacity: 0.9;">${course.teacher}</div>
                            <div style="font-size: 11px; opacity: 0.9;">${course.room}</div>
                        </td>`;
                    } else {
                        tableHTML += '<td style="background: #f9f9f9;"></td>';
                    }
                });
                tableHTML += '</tr>';
            });

            tableHTML += '</tbody></table></div>';

            // 列出已选课程
            const selectedCourseDetails = selectedCourses.map(code => {
                const course = courses.find(c => c.code === code);
                const schedule = schedules.find(s => s.courseCode === code);
                return {
                    code,
                    name: course ? course.name : '未知课程',
                    credits: course ? course.credits : 0,
                    time: schedule ? schedule.time : '未排课',
                    room: schedule ? schedule.room : '-'
                };
            });

            const courseListHTML = `
                <div style="margin-top: 20px;">
                    <h4 style="font-size: 16px; margin-bottom: 12px; color: var(--secondary-text);">已选课程列表</h4>
                    <table class="data-table" style="font-size: 13px;">
                        <thead>
                            <tr>
                                <th>课程代码</th>
                                <th>课程名称</th>
                                <th>学分</th>
                                <th>上课时间</th>
                                <th>教室</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${selectedCourseDetails.map(c => `
                                <tr>
                                    <td>${c.code}</td>
                                    <td>${c.name}</td>
                                    <td>${c.credits}</td>
                                    <td>${c.time}</td>
                                    <td>${c.room}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p style="margin-top: 12px; color: var(--secondary-text); font-size: 14px;">
                        总学分：<strong>${selectedCourseDetails.reduce((sum, c) => sum + c.credits, 0)}</strong> | 
                        已选课程：<strong>${selectedCourses.length}</strong>门
                    </p>
                </div>
            `;

            document.getElementById('modalBody').innerHTML = `
                <div style="margin-bottom: 16px;">
                    <p style="color: var(--secondary-text); font-size: 14px;">
                        学生：${studentName} | 学号：${studentId}
                    </p>
                </div>
                ${tableHTML}
                ${courseListHTML}
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">关闭</button>
                    <button class="btn btn-primary" onclick="eduAdmin.manageStudentCourses('${studentId}', '${studentName}')">管理选课</button>
                    <button class="btn btn-primary" onclick="eduAdmin.exportStudentSchedule('${studentId}', '${studentName}')">导出课程表</button>
                </div>
            `;
        }
        
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 管理学生选课（新增）
    manageStudentCourses(studentId, studentName) {
        const studentCourses = this.getData(this.STORAGE_KEYS.STUDENT_COURSES);
        const selectedCourses = studentCourses[studentId] || [];
        const allCourses = this.getData(this.STORAGE_KEYS.COURSES);
        const schedules = this.getData(this.STORAGE_KEYS.SCHEDULES);

        document.getElementById('modalTitle').textContent = `管理选课 - ${studentName}（${studentId}）`;
        
        const courseListHTML = allCourses.map(course => {
            const isSelected = selectedCourses.includes(course.code);
            const schedule = schedules.find(s => s.courseCode === course.code);
            const timeInfo = schedule ? `${schedule.time} | ${schedule.room}` : '未排课';
            
            return `
                <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px; margin-bottom: 12px; ${isSelected ? 'background: #e8f5e9; border-color: #4caf50;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; margin-bottom: 4px;">
                                ${course.name} 
                                <span style="background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 8px;">${course.code}</span>
                            </div>
                            <div style="font-size: 13px; color: #666;">
                                学分：${course.credits} | ${timeInfo}
                            </div>
                        </div>
                        <div>
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" 
                                       id="course_${course.code}" 
                                       value="${course.code}" 
                                       ${isSelected ? 'checked' : ''}
                                       style="width: 20px; height: 20px; cursor: pointer;">
                                <span style="margin-left: 8px; font-size: 14px; font-weight: 500;">
                                    ${isSelected ? '已选' : '选择'}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 16px;">
                <p style="color: var(--secondary-text); font-size: 14px;">
                    为学生选择课程（选择后点击保存）
                </p>
            </div>
            <div style="max-height: 400px; overflow-y: auto; padding-right: 8px;">
                ${courseListHTML}
            </div>
            <input type="hidden" id="manageCourseStudentId" value="${studentId}">
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="eduAdmin.saveStudentCourses()">保存选课</button>
            </div>
        `;
        
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 保存学生选课（新增）
    saveStudentCourses() {
        const studentId = document.getElementById('manageCourseStudentId').value;
        const allCourses = this.getData(this.STORAGE_KEYS.COURSES);
        const studentCourses = this.getData(this.STORAGE_KEYS.STUDENT_COURSES);
        
        // 获取所有被选中的课程
        const selectedCourses = allCourses
            .filter(c => document.getElementById(`course_${c.code}`)?.checked)
            .map(c => c.code);
        
        // 更新学生选课记录
        studentCourses[studentId] = selectedCourses;
        this.saveData(this.STORAGE_KEYS.STUDENT_COURSES, studentCourses);
        
        this.closeModal();
        this.loadStudents(); // 刷新学生列表（显示选课数）
        this.showToast(`✅ 已保存选课，共选 ${selectedCourses.length} 门课程`);
    },

    // 导出学生课程表（模拟）
    exportStudentSchedule(studentId, studentName) {
        this.showToast(`✅ ${studentName}的课程表已导出（模拟）`);
    },

    // ==================== 教师管理 ====================
    
    // 加载教师列表
    loadTeachers() {
        const teachers = this.getData(this.STORAGE_KEYS.TEACHERS);
        const tbody = document.getElementById('teachersTableBody');
        
        if (!tbody) return;
        
        tbody.innerHTML = teachers.map(t => `
            <tr>
                <td>${t.id}</td>
                <td>${t.name}</td>
                <td>${t.title}</td>
                <td>${t.department}</td>
                <td>${t.contact}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.editTeacher('${t.id}')">编辑</button>
                    <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.deleteTeacher('${t.id}')">删除</button>
                </td>
            </tr>
        `).join('');
    },

    // 搜索教师
    searchTeachers(query) {
        const teachers = this.getData(this.STORAGE_KEYS.TEACHERS);
        const filtered = teachers.filter(t => 
            t.id.toLowerCase().includes(query.toLowerCase()) ||
            t.name.toLowerCase().includes(query.toLowerCase())
        );
        
        const tbody = document.getElementById('teachersTableBody');
        tbody.innerHTML = filtered.map(t => `
            <tr>
                <td>${t.id}</td>
                <td>${t.name}</td>
                <td>${t.title}</td>
                <td>${t.department}</td>
                <td>${t.contact}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.editTeacher('${t.id}')">编辑</button>
                    <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.deleteTeacher('${t.id}')">删除</button>
                </td>
            </tr>
        `).join('');
    },

    // 编辑教师（新增）
    editTeacher(id) {
        const teachers = this.getData(this.STORAGE_KEYS.TEACHERS);
        const teacher = teachers.find(t => t.id === id);
        
        if (!teacher) {
            alert('未找到该教师！');
            return;
        }

        document.getElementById('modalTitle').textContent = '编辑教师信息';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label class="form-label">工号</label>
                <input type="text" class="form-input" id="editTeacherId" value="${teacher.id}" readonly style="background: #f5f5f5;">
            </div>
            <div class="form-group">
                <label class="form-label">姓名</label>
                <input type="text" class="form-input" id="editTeacherName" value="${teacher.name}">
            </div>
            <div class="form-group">
                <label class="form-label">职称</label>
                <select class="form-input" id="editTeacherTitle">
                    <option value="讲师" ${teacher.title === '讲师' ? 'selected' : ''}>讲师</option>
                    <option value="副教授" ${teacher.title === '副教授' ? 'selected' : ''}>副教授</option>
                    <option value="教授" ${teacher.title === '教授' ? 'selected' : ''}>教授</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">院系</label>
                <input type="text" class="form-input" id="editTeacherDept" value="${teacher.department}">
            </div>
            <div class="form-group">
                <label class="form-label">联系方式</label>
                <input type="text" class="form-input" id="editTeacherContact" value="${teacher.contact}">
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="eduAdmin.saveEditTeacher()">保存</button>
            </div>
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 保存编辑的教师信息（新增）
    saveEditTeacher() {
        const id = document.getElementById('editTeacherId').value.trim();
        const name = document.getElementById('editTeacherName').value.trim();
        const title = document.getElementById('editTeacherTitle').value;
        const department = document.getElementById('editTeacherDept').value.trim();
        const contact = document.getElementById('editTeacherContact').value.trim();

        if (!name || !department || !contact) {
            alert('请填写完整信息！');
            return;
        }

        const teachers = this.getData(this.STORAGE_KEYS.TEACHERS);
        const index = teachers.findIndex(t => t.id === id);
        
        if (index !== -1) {
            teachers[index] = { id, name, title, department, contact };
            this.saveData(this.STORAGE_KEYS.TEACHERS, teachers);
            
            this.closeModal();
            this.loadTeachers();
            this.showToast('✅ 修改成功');
        }
    },

    // 添加教师模态框
    showAddTeacherModal() {
        document.getElementById('modalTitle').textContent = '添加教师';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label class="form-label">工号</label>
                <input type="text" class="form-input" id="newTeacherId" placeholder="例如：T005">
            </div>
            <div class="form-group">
                <label class="form-label">姓名</label>
                <input type="text" class="form-input" id="newTeacherName" placeholder="请输入姓名">
            </div>
            <div class="form-group">
                <label class="form-label">职称</label>
                <select class="form-input" id="newTeacherTitle">
                    <option value="讲师">讲师</option>
                    <option value="副教授">副教授</option>
                    <option value="教授">教授</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">院系</label>
                <input type="text" class="form-input" id="newTeacherDept" placeholder="例如：计算机学院">
            </div>
            <div class="form-group">
                <label class="form-label">联系方式</label>
                <input type="text" class="form-input" id="newTeacherContact" placeholder="请输入手机号">
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="eduAdmin.saveNewTeacher()">保存</button>
            </div>
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 保存新教师
    saveNewTeacher() {
        const id = document.getElementById('newTeacherId').value.trim();
        const name = document.getElementById('newTeacherName').value.trim();
        const title = document.getElementById('newTeacherTitle').value;
        const department = document.getElementById('newTeacherDept').value.trim();
        const contact = document.getElementById('newTeacherContact').value.trim();

        if (!id || !name || !department || !contact) {
            alert('请填写完整信息！');
            return;
        }

        const teachers = this.getData(this.STORAGE_KEYS.TEACHERS);
        
        // 检查工号是否已存在
        if (teachers.find(t => t.id === id)) {
            alert('该工号已存在！');
            return;
        }

        teachers.push({ id, name, title, department, contact });
        this.saveData(this.STORAGE_KEYS.TEACHERS, teachers);
        
        this.closeModal();
        this.loadTeachers();
        this.showToast('✅ 添加成功');
    },

    // 删除教师
    deleteTeacher(id) {
        if (confirm(`确定要删除工号为 ${id} 的教师吗？`)) {
            let teachers = this.getData(this.STORAGE_KEYS.TEACHERS);
            teachers = teachers.filter(t => t.id !== id);
            this.saveData(this.STORAGE_KEYS.TEACHERS, teachers);
            this.loadTeachers();
            this.showToast('✅ 删除成功');
        }
    },

    // ==================== 课程管理 ====================
    
    // 加载课程列表
    loadCourses() {
        const courses = this.getData(this.STORAGE_KEYS.COURSES);
        const tbody = document.getElementById('coursesTableBody');
        
        if (!tbody) return;
        
        tbody.innerHTML = courses.map(c => `
            <tr>
                <td>${c.code}</td>
                <td>${c.name}</td>
                <td>${c.credits}</td>
                <td>${c.hours}</td>
                <td>${c.department}</td>
                <td><span class="tag tag-success">${c.status}</span></td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.editCourse('${c.code}')">编辑</button>
                    <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.deleteCourse('${c.code}')">删除</button>
                </td>
            </tr>
        `).join('');
    },

    // 搜索课程
    searchCourses(query) {
        const courses = this.getData(this.STORAGE_KEYS.COURSES);
        const filtered = courses.filter(c => 
            c.code.toLowerCase().includes(query.toLowerCase()) ||
            c.name.toLowerCase().includes(query.toLowerCase())
        );
        
        const tbody = document.getElementById('coursesTableBody');
        tbody.innerHTML = filtered.map(c => `
            <tr>
                <td>${c.code}</td>
                <td>${c.name}</td>
                <td>${c.credits}</td>
                <td>${c.hours}</td>
                <td>${c.department}</td>
                <td><span class="tag tag-success">${c.status}</span></td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.editCourse('${c.code}')">编辑</button>
                    <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.deleteCourse('${c.code}')">删除</button>
                </td>
            </tr>
        `).join('');
    },

    // 编辑课程（新增）
    editCourse(code) {
        const courses = this.getData(this.STORAGE_KEYS.COURSES);
        const course = courses.find(c => c.code === code);
        
        if (!course) {
            alert('未找到该课程！');
            return;
        }

        document.getElementById('modalTitle').textContent = '编辑课程信息';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">课程代码</label>
                    <input type="text" class="form-input" id="editCourseCode" value="${course.code}" readonly style="background: #f5f5f5;">
                </div>
                <div class="form-group">
                    <label class="form-label">课程名称</label>
                    <input type="text" class="form-input" id="editCourseName" value="${course.name}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">学分</label>
                    <input type="number" class="form-input" id="editCourseCredits" value="${course.credits}">
                </div>
                <div class="form-group">
                    <label class="form-label">课时</label>
                    <input type="number" class="form-input" id="editCourseHours" value="${course.hours}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">开课院系</label>
                <input type="text" class="form-input" id="editCourseDept" value="${course.department}">
            </div>
            <div class="form-group">
                <label class="form-label">状态</label>
                <select class="form-input" id="editCourseStatus">
                    <option value="开课中" ${course.status === '开课中' ? 'selected' : ''}>开课中</option>
                    <option value="已结课" ${course.status === '已结课' ? 'selected' : ''}>已结课</option>
                    <option value="停开" ${course.status === '停开' ? 'selected' : ''}>停开</option>
                </select>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="eduAdmin.saveEditCourse()">保存</button>
            </div>
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 保存编辑的课程信息（新增）
    saveEditCourse() {
        const code = document.getElementById('editCourseCode').value.trim();
        const name = document.getElementById('editCourseName').value.trim();
        const credits = parseInt(document.getElementById('editCourseCredits').value);
        const hours = parseInt(document.getElementById('editCourseHours').value);
        const department = document.getElementById('editCourseDept').value.trim();
        const status = document.getElementById('editCourseStatus').value;

        if (!name || !credits || !hours || !department) {
            alert('请填写完整信息！');
            return;
        }

        const courses = this.getData(this.STORAGE_KEYS.COURSES);
        const index = courses.findIndex(c => c.code === code);
        
        if (index !== -1) {
            courses[index] = { code, name, credits, hours, department, status };
            this.saveData(this.STORAGE_KEYS.COURSES, courses);
            
            this.closeModal();
            this.loadCourses();
            this.showToast('✅ 修改成功');
        }
    },

    // 删除课程（新增）
    deleteCourse(code) {
        if (confirm(`确定要删除课程 ${code} 吗？`)) {
            let courses = this.getData(this.STORAGE_KEYS.COURSES);
            courses = courses.filter(c => c.code !== code);
            this.saveData(this.STORAGE_KEYS.COURSES, courses);
            this.loadCourses();
            this.showToast('✅ 删除成功');
        }
    },

    // 添加课程模态框
    showAddCourseModal() {
        document.getElementById('modalTitle').textContent = '添加课程';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">课程代码</label>
                    <input type="text" class="form-input" id="newCourseCode" placeholder="例如：CS104">
                </div>
                <div class="form-group">
                    <label class="form-label">课程名称</label>
                    <input type="text" class="form-input" id="newCourseName" placeholder="例如：操作系统">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">学分</label>
                    <input type="number" class="form-input" id="newCourseCredits" placeholder="例如：4">
                </div>
                <div class="form-group">
                    <label class="form-label">课时</label>
                    <input type="number" class="form-input" id="newCourseHours" placeholder="例如：64">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">开课院系</label>
                <input type="text" class="form-input" id="newCourseDept" placeholder="例如：计算机学院">
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="eduAdmin.saveNewCourse()">保存</button>
            </div>
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 保存新课程
    saveNewCourse() {
        const code = document.getElementById('newCourseCode').value.trim();
        const name = document.getElementById('newCourseName').value.trim();
        const credits = parseInt(document.getElementById('newCourseCredits').value);
        const hours = parseInt(document.getElementById('newCourseHours').value);
        const department = document.getElementById('newCourseDept').value.trim();

        if (!code || !name || !credits || !hours || !department) {
            alert('请填写完整信息！');
            return;
        }

        const courses = this.getData(this.STORAGE_KEYS.COURSES);
        
        // 检查课程代码是否已存在
        if (courses.find(c => c.code === code)) {
            alert('该课程代码已存在！');
            return;
        }

        courses.push({ code, name, credits, hours, department, status: '开课中' });
        this.saveData(this.STORAGE_KEYS.COURSES, courses);
        
        this.closeModal();
        this.loadCourses();
        this.showToast('✅ 添加成功');
    },

    // ==================== 班级管理 ====================
    
    // 加载班级列表（修复：动态计算学生人数）
    loadClasses() {
        const classes = this.getData(this.STORAGE_KEYS.CLASSES);
        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        const container = document.getElementById('classesContainer');
        
        if (!container) return;
        
        // 为每个班级统计实际学生数
        const classesWithCount = classes.map(cls => {
            const count = students.filter(s => s.class === cls.name).length;
            return { ...cls, actualStudentCount: count };
        });

        container.innerHTML = classesWithCount.map(cls => `
            <div class="card" style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${cls.name}</h3>
                        <p style="color: var(--secondary-text); font-size: 14px; margin-bottom: 4px;">专业：${cls.major}</p>
                        <p style="color: var(--secondary-text); font-size: 14px;">入学年份：${cls.year} | 学生人数：<strong>${cls.actualStudentCount}</strong>人</p>
                    </div>
                    <div>
                        <button class="btn btn-secondary" style="margin-right: 8px;" onclick="eduAdmin.viewClassStudents('${cls.name}')">查看学生</button>
                        <button class="btn btn-primary" style="margin-right: 8px;" onclick="eduAdmin.generateClassSchedule('${cls.name}')">查看课程表</button>
                        <button class="btn btn-danger" onclick="eduAdmin.deleteClass('${cls.id}')">删除</button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // 查看班级学生（新增）
    viewClassStudents(className) {
        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        const classStudents = students.filter(s => s.class === className);

        document.getElementById('modalTitle').textContent = `${className} 学生名单`;
        
        if (classStudents.length === 0) {
            document.getElementById('modalBody').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <p>该班级暂无学生</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">关闭</button>
                </div>
            `;
        } else {
            document.getElementById('modalBody').innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>学号</th>
                            <th>姓名</th>
                            <th>专业</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${classStudents.map(s => `
                            <tr>
                                <td>${s.id}</td>
                                <td>${s.name}</td>
                                <td>${s.major}</td>
                                <td><span class="tag tag-success">${s.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">关闭</button>
            </div>
            `;
        }
        
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 生成班级课程表（新增 - PDF要求的核心功能）
    generateClassSchedule(className) {
        const schedules = this.getData(this.STORAGE_KEYS.SCHEDULES);
        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        const classStudents = students.filter(s => s.class === className);

        document.getElementById('modalTitle').textContent = `${className} 课程表`;
        
        // 生成课程表HTML
        const weekdays = ['周一', '周二', '周三', '周四', '周五'];
        const periods = ['1-2节', '3-4节', '5-6节', '7-8节'];

        let tableHTML = '<div style="overflow-x: auto;"><table class="data-table" style="min-width: 600px;">';
        tableHTML += '<thead><tr><th style="width: 100px;">时间</th>';
        weekdays.forEach(day => {
            tableHTML += `<th>${day}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        periods.forEach(period => {
            tableHTML += `<tr><td><strong>${period}</strong></td>`;
            weekdays.forEach(day => {
                const course = schedules.find(s => s.time === `${day} ${period}`);
                if (course) {
                    tableHTML += `<td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${course.courseName}</div>
                        <div style="font-size: 11px; opacity: 0.9;">${course.teacher}</div>
                        <div style="font-size: 11px; opacity: 0.9;">${course.room}</div>
                    </td>`;
                } else {
                    tableHTML += '<td></td>';
                }
            });
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table></div>';

        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 16px;">
                <p style="color: var(--secondary-text); font-size: 14px;">
                    班级人数：${classStudents.length}人 | 本学期课程数：${schedules.length}门
                </p>
            </div>
            ${tableHTML}
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">关闭</button>
                <button class="btn btn-primary" onclick="eduAdmin.exportSchedule('${className}')">导出课程表</button>
            </div>
        `;
        
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 导出课程表（模拟）
    exportSchedule(className) {
        this.showToast(`✅ ${className} 课程表已导出（模拟）`);
    },

    // 删除班级（新增）
    deleteClass(id) {
        const classes = this.getData(this.STORAGE_KEYS.CLASSES);
        const cls = classes.find(c => c.id === id);
        
        if (!cls) {
            alert('未找到该班级！');
            return;
        }

        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        const classStudents = students.filter(s => s.class === cls.name);

        if (classStudents.length > 0) {
            if (!confirm(`该班级还有 ${classStudents.length} 名学生，确定要删除吗？删除后学生的班级信息将被清空。`)) {
                return;
            }
            
            // 清空学生的班级信息
            students.forEach(s => {
                if (s.class === cls.name) {
                    s.class = '';
                }
            });
            this.saveData(this.STORAGE_KEYS.STUDENTS, students);
        }

        const newClasses = classes.filter(c => c.id !== id);
        this.saveData(this.STORAGE_KEYS.CLASSES, newClasses);
        this.loadClasses();
        this.showToast('✅ 删除成功');
    },

    // 添加班级模态框
    showAddClassModal() {
        document.getElementById('modalTitle').textContent = '添加班级';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label class="form-label">班级名称</label>
                <input type="text" class="form-input" id="newClassName" placeholder="例如：计算机2401">
            </div>
            <div class="form-group">
                <label class="form-label">专业</label>
                <input type="text" class="form-input" id="newClassMajor" placeholder="例如：计算机科学与技术">
            </div>
            <div class="form-group">
                <label class="form-label">入学年份</label>
                <input type="number" class="form-input" id="newClassYear" placeholder="例如：2024" value="2024">
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="eduAdmin.saveNewClass()">保存</button>
            </div>
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 保存新班级
    saveNewClass() {
        const name = document.getElementById('newClassName').value.trim();
        const major = document.getElementById('newClassMajor').value.trim();
        const year = parseInt(document.getElementById('newClassYear').value);

        if (!name || !major || !year) {
            alert('请填写完整信息！');
            return;
        }

        const classes = this.getData(this.STORAGE_KEYS.CLASSES);
        
        // 检查班级名称是否已存在
        if (classes.find(c => c.name === name)) {
            alert('该班级名称已存在！');
            return;
        }

        const id = 'CLS' + String(classes.length + 1).padStart(3, '0');
        classes.push({ id, name, major, year });
        this.saveData(this.STORAGE_KEYS.CLASSES, classes);
        
        this.closeModal();
        this.loadClasses();
        this.showToast('✅ 添加成功');
    },

    // ==================== 排课管理 ====================
    
    // 加载排课管理
    loadScheduling() {
        const allSchedules = this.getData(this.STORAGE_KEYS.SCHEDULES);
        const selectedSemester = document.getElementById('semesterSelect')?.value || '2024-2025-1';
        const studentCourses = this.getData(this.STORAGE_KEYS.STUDENT_COURSES);
        const tbody = document.getElementById('schedulingTableBody');
        
        if (!tbody) return;
        
        // 根据学期筛选排课数据
        const schedules = allSchedules.filter(s => s.semester === selectedSemester);
        
        // 计算每门课的实际已选人数
        const schedulesWithEnrolled = schedules.map(s => {
            // 统计有多少学生选了这门课
            let enrolledCount = 0;
            Object.values(studentCourses).forEach(courses => {
                if (courses.includes(s.courseCode)) {
                    enrolledCount++;
                }
            });
            return { ...s, enrolled: enrolledCount };
        });
        
        if (schedulesWithEnrolled.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:#888;">当前学期暂无开课计划</td></tr>';
        } else {
            tbody.innerHTML = schedulesWithEnrolled.map(s => `
                <tr>
                    <td>${s.courseName}</td>
                    <td>${s.teacher}</td>
                    <td>${s.time}</td>
                    <td>${s.room}</td>
                    <td>${s.capacity}</td>
                    <td><strong style="color: ${s.enrolled > s.capacity ? 'var(--danger-color)' : 'var(--accent-color)'};">${s.enrolled}</strong></td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.editSchedule('${s.id}')">编辑</button>
                        <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.deleteSchedule('${s.id}')">删除</button>
                    </td>
                </tr>
            `).join('');
        }

        // 生成课程表预览
        this.generateSchedulePreview(schedulesWithEnrolled);
    },

    // 生成课程表预览
    generateSchedulePreview(schedules) {
        const table = document.getElementById('schedulePreview');
        if (!table) return;

        const weekdays = ['周一', '周二', '周三', '周四', '周五'];
        const periods = ['1-2节', '3-4节', '5-6节', '7-8节'];

        let html = '<thead><tr><th style="width: 100px;">时间</th>';
        weekdays.forEach(day => {
            html += `<th>${day}</th>`;
        });
        html += '</tr></thead><tbody>';

        periods.forEach(period => {
            html += `<tr><td><strong>${period}</strong></td>`;
            weekdays.forEach(day => {
                const course = schedules.find(s => s.time === `${day} ${period}`);
                if (course) {
                    html += `<td><div class="course-block">
                        <div class="course-name">${course.courseName}</div>
                        <div class="course-info">${course.teacher} | ${course.room}</div>
                    </div></td>`;
                } else {
                    html += '<td></td>';
                }
            });
            html += '</tr>';
        });

        html += '</tbody>';
        table.innerHTML = html;
    },

    // 重置排课数据（新增）
    resetScheduleData() {
        if (confirm('确定要重置排课数据吗？\n\n这将：\n1. 清除所有现有排课\n2. 恢复默认的示例排课数据（包含第一、第二学期）\n3. 学生的选课记录不会受影响')) {
            const schedules = [
                { id: 'SCH001', courseCode: 'CS101', courseName: '数据结构与算法', teacher: '王教授', time: '周一 1-2节', room: 'A101', capacity: 80, semester: '2024-2025-1' },
                { id: 'SCH002', courseCode: 'CS102', courseName: 'Web前端开发', teacher: '李副教授', time: '周二 3-4节', room: 'B202', capacity: 60, semester: '2024-2025-1' },
                { id: 'SCH003', courseCode: 'CS103', courseName: '数据库系统', teacher: '张讲师', time: '周三 5-6节', room: 'C303', capacity: 70, semester: '2024-2025-1' },
                { id: 'SCH004', courseCode: 'SE101', courseName: '软件工程', teacher: '李副教授', time: '周四 1-2节', room: 'A201', capacity: 60, semester: '2024-2025-1' },
                { id: 'SCH005', courseCode: 'MA101', courseName: '高等数学', teacher: '刘老师', time: '周五 3-4节', room: 'D401', capacity: 100, semester: '2024-2025-1' },
                // 第二学期的课程
                { id: 'SCH006', courseCode: 'CS101', courseName: '数据结构与算法', teacher: '王教授', time: '周一 1-2节', room: 'A101', capacity: 80, semester: '2024-2025-2' },
                { id: 'SCH007', courseCode: 'SE101', courseName: '软件工程', teacher: '张讲师', time: '周三 3-4节', room: 'B303', capacity: 70, semester: '2024-2025-2' },
                { id: 'SCH008', courseCode: 'MA101', courseName: '高等数学', teacher: '刘老师', time: '周五 3-4节', room: 'D401', capacity: 100, semester: '2024-2025-2' }
            ];
            this.saveData(this.STORAGE_KEYS.SCHEDULES, schedules);
            this.loadScheduling();
            this.showToast('✅ 排课数据已重置');
        }
    },

    // 验证上课时间格式（新增）
    validateScheduleTime(time) {
        const validDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const validPeriods = ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节'];
        
        const parts = time.trim().split(' ');
        if (parts.length !== 2) {
            return false;
        }
        
        const [day, period] = parts;
        return validDays.includes(day) && validPeriods.includes(period);
    },

    // 检查时间冲突（新增 - 同一学期内不能有时间冲突）
    checkTimeConflict(time, semester, excludeId = null) {
        const schedules = this.getData(this.STORAGE_KEYS.SCHEDULES);
        const conflict = schedules.find(s => 
            s.time === time && 
            s.semester === semester && 
            s.id !== excludeId
        );
        return conflict;
    },

    // 编辑排课（新增）
    editSchedule(id) {
        const schedules = this.getData(this.STORAGE_KEYS.SCHEDULES);
        const schedule = schedules.find(s => s.id === id);
        
        if (!schedule) {
            alert('未找到该排课信息！');
            return;
        }

        const courses = this.getData(this.STORAGE_KEYS.COURSES);
        const teachers = this.getData(this.STORAGE_KEYS.TEACHERS);

        // 计算实际已选人数
        const studentCourses = this.getData(this.STORAGE_KEYS.STUDENT_COURSES);
        let enrolledCount = 0;
        Object.values(studentCourses).forEach(courses => {
            if (courses.includes(schedule.courseCode)) {
                enrolledCount++;
            }
        });

        document.getElementById('modalTitle').textContent = '编辑排课信息';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label class="form-label">选择课程</label>
                <select class="form-input" id="editScheduleCourse">
                    ${courses.map(c => `<option value="${c.code}" ${c.code === schedule.courseCode ? 'selected' : ''}>${c.name} (${c.code})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">授课教师</label>
                <select class="form-input" id="editScheduleTeacher">
                    ${teachers.map(t => `<option value="${t.name}" ${t.name === schedule.teacher ? 'selected' : ''}>${t.name} - ${t.title}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">学期</label>
                <select class="form-input" id="editScheduleSemester">
                    <option value="2024-2025-1" ${schedule.semester === '2024-2025-1' ? 'selected' : ''}>2024-2025学年第一学期</option>
                    <option value="2024-2025-2" ${schedule.semester === '2024-2025-2' ? 'selected' : ''}>2024-2025学年第二学期</option>
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">上课时间</label>
                    <select class="form-input" id="editScheduleTime">
                        ${this.generateTimeOptions(schedule.time)}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">教室</label>
                    <input type="text" class="form-input" id="editScheduleRoom" value="${schedule.room}" placeholder="例如：A101">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">容量</label>
                    <input type="number" class="form-input" id="editScheduleCapacity" value="${schedule.capacity}" min="1" placeholder="例如：80">
                </div>
                <div class="form-group">
                    <label class="form-label">已选人数（自动统计）</label>
                    <input type="number" class="form-input" value="${enrolledCount}" readonly style="background: #f5f5f5; cursor: not-allowed;" title="已选人数根据学生选课记录自动统计">
                    <small style="color: var(--secondary-text); font-size: 12px;">💡 已选人数由系统自动统计，不可手动修改</small>
                </div>
            </div>
            <input type="hidden" id="editScheduleId" value="${id}">
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="eduAdmin.saveEditSchedule()">保存</button>
            </div>
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 生成时间选项（新增）
    generateTimeOptions(selectedTime = '') {
        const days = ['周一', '周二', '周三', '周四', '周五'];
        const periods = ['1-2节', '3-4节', '5-6节', '7-8节'];
        
        let options = '';
        days.forEach(day => {
            periods.forEach(period => {
                const time = `${day} ${period}`;
                const selected = time === selectedTime ? 'selected' : '';
                options += `<option value="${time}" ${selected}>${time}</option>`;
            });
        });
        
        return options;
    },

    // 保存编辑的排课信息（新增）
    saveEditSchedule() {
        const id = document.getElementById('editScheduleId').value;
        const courseCode = document.getElementById('editScheduleCourse').value;
        const teacher = document.getElementById('editScheduleTeacher').value;
        const semester = document.getElementById('editScheduleSemester').value;
        const time = document.getElementById('editScheduleTime').value;
        const room = document.getElementById('editScheduleRoom').value.trim();
        const capacity = parseInt(document.getElementById('editScheduleCapacity').value);

        if (!room || !capacity || capacity < 1) {
            alert('请填写完整且正确的信息！');
            return;
        }

        // 检查时间冲突（排除当前记录，同一学期）
        const conflict = this.checkTimeConflict(time, semester, id);
        if (conflict) {
            alert(`时间冲突！该时间段已安排课程：${conflict.courseName}`);
            return;
        }

        const courses = this.getData(this.STORAGE_KEYS.COURSES);
        const course = courses.find(c => c.code === courseCode);

        const schedules = this.getData(this.STORAGE_KEYS.SCHEDULES);
        const index = schedules.findIndex(s => s.id === id);
        
        if (index !== -1) {
            schedules[index] = {
                id,
                courseCode,
                courseName: course.name,
                teacher,
                semester,
                time,
                room,
                capacity
            };
            this.saveData(this.STORAGE_KEYS.SCHEDULES, schedules);
            
            this.closeModal();
            this.loadScheduling();
            this.showToast('✅ 修改成功');
        }
    },

    // 删除排课（新增）
    deleteSchedule(id) {
        if (confirm('确定要删除这个排课安排吗？')) {
            let schedules = this.getData(this.STORAGE_KEYS.SCHEDULES);
            schedules = schedules.filter(s => s.id !== id);
            this.saveData(this.STORAGE_KEYS.SCHEDULES, schedules);
            this.loadScheduling();
            this.showToast('✅ 删除成功');
        }
    },

    // 添加排课模态框（改进：增加输入验证）
    showScheduleCourseModal() {
        const courses = this.getData(this.STORAGE_KEYS.COURSES);
        const teachers = this.getData(this.STORAGE_KEYS.TEACHERS);
        const currentSemester = document.getElementById('semesterSelect')?.value || '2024-2025-1';

        document.getElementById('modalTitle').textContent = '安排课程';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label class="form-label">选择课程</label>
                <select class="form-input" id="scheduleCourse">
                    ${courses.map(c => `<option value="${c.code}">${c.name} (${c.code})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">授课教师</label>
                <select class="form-input" id="scheduleTeacher">
                    ${teachers.map(t => `<option value="${t.name}">${t.name} - ${t.title}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">学期</label>
                <select class="form-input" id="scheduleSemester">
                    <option value="2024-2025-1" ${currentSemester === '2024-2025-1' ? 'selected' : ''}>2024-2025学年第一学期</option>
                    <option value="2024-2025-2" ${currentSemester === '2024-2025-2' ? 'selected' : ''}>2024-2025学年第二学期</option>
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">上课时间</label>
                    <select class="form-input" id="scheduleTime">
                        ${this.generateTimeOptions()}
                    </select>
                    <small style="color: var(--secondary-text); font-size: 12px;">请选择上课时间</small>
                </div>
                <div class="form-group">
                    <label class="form-label">教室</label>
                    <input type="text" class="form-input" id="scheduleRoom" placeholder="例如：A101">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">容量</label>
                <input type="number" class="form-input" id="scheduleCapacity" placeholder="例如：80" min="1" value="50">
            </div>
            <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                <small style="color: #2e7d32; font-size: 13px;">💡 <strong>提示：</strong>已选人数将根据学生选课记录自动统计，无需手动输入。</small>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="eduAdmin.saveSchedule()">保存</button>
            </div>
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 保存排课（改进：增加验证）
    saveSchedule() {
        const courseCode = document.getElementById('scheduleCourse').value;
        const teacher = document.getElementById('scheduleTeacher').value;
        const semester = document.getElementById('scheduleSemester').value;
        const time = document.getElementById('scheduleTime').value;
        const room = document.getElementById('scheduleRoom').value.trim();
        const capacity = parseInt(document.getElementById('scheduleCapacity').value);

        // 输入验证
        if (!room) {
            alert('请填写教室！');
            return;
        }

        if (!capacity || capacity < 1) {
            alert('容量必须大于0！');
            return;
        }

        // 检查时间冲突（同一学期）
        const conflict = this.checkTimeConflict(time, semester);
        if (conflict) {
            alert(`时间冲突！该时间段已安排课程：${conflict.courseName}`);
            return;
        }

        const courses = this.getData(this.STORAGE_KEYS.COURSES);
        const course = courses.find(c => c.code === courseCode);

        const schedules = this.getData(this.STORAGE_KEYS.SCHEDULES);
        const id = 'SCH' + String(schedules.length + 1).padStart(3, '0');
        schedules.push({
            id,
            courseCode,
            courseName: course.name,
            teacher,
            semester,
            time,
            room,
            capacity
        });
        this.saveData(this.STORAGE_KEYS.SCHEDULES, schedules);
        
        this.closeModal();
        this.loadScheduling();
        this.showToast('✅ 排课成功');
    },

    // ==================== 核心功能：成绩审核与异常监控 ====================
    
    // 加载成绩审核页面（PDF要求的核心功能）
    loadGrades() {
        const grades = this.getData(this.STORAGE_KEYS.GRADES);
        
        // 分析成绩数据
        const analysis = grades.map(g => this.analyzeCourseGrades(g));
        
        // 更新统计数据
        const pendingCourses = grades.filter(g => !g.published).length;
        const anomalyCourses = analysis.filter(a => a.isAnomaly).length;
        
        document.getElementById('statPendingCourses').textContent = pendingCourses;
        document.getElementById('statAnomalyCourses').textContent = anomalyCourses;
        
        // 渲染课程成绩表格
        const tbody = document.getElementById('gradesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = analysis.map(a => {
            // 根据异常程度设置行样式
            let rowClass = '';
            let anomalyBadge = '<span class="tag tag-success">正常</span>';
            
            if (a.isAnomaly) {
                if (a.passRate < 0.6) {
                    rowClass = 'anomaly-severe'; // 严重异常：及格率低
                    anomalyBadge = '<span class="tag tag-danger">严重异常：及格率低</span>';
                } else if (a.excellentRate >= 0.7) {
                    rowClass = 'anomaly-row'; // 一般异常：优秀率高
                    anomalyBadge = '<span class="tag tag-warning">异常：优秀率过高</span>';
                }
            }
            
            const publishBadge = a.published 
                ? '<span class="tag tag-success">已发布</span>' 
                : '<span class="tag tag-warning">待发布</span>';
            
            return `
                <tr class="${rowClass}">
                    <td>${a.courseCode}</td>
                    <td>${a.courseName}</td>
                    <td>${a.teacher}</td>
                    <td>${a.studentCount}</td>
                    <td><strong>${a.average.toFixed(1)}</strong></td>
                    <td>${(a.excellentRate * 100).toFixed(1)}%</td>
                    <td>${(a.passRate * 100).toFixed(1)}%</td>
                    <td>${anomalyBadge}</td>
                    <td>${publishBadge}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.viewGradeDetails('${a.courseCode}')">详情</button>
                        ${!a.published ? `<button class="btn btn-primary" style="padding: 4px 12px; font-size: 12px;" onclick="eduAdmin.publishGrade('${a.courseCode}')">发布</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        // 加载学生异常监控
        this.loadStudentAnomalyAnalysis();
    },

    // 分析课程成绩（异常检测核心算法）
    analyzeCourseGrades(gradeData) {
        const scores = gradeData.scores;
        const total = scores.reduce((sum, s) => sum + s, 0);
        const average = total / scores.length;
        
        // 计算优秀率（>=85分）和及格率（>=60分）
        const excellentCount = scores.filter(s => s >= 85).length;
        const passCount = scores.filter(s => s >= 60).length;
        
        const excellentRate = excellentCount / scores.length;
        const passRate = passCount / scores.length;
        
        // 异常判定逻辑（符合PDF要求）
        // 1. 优秀率过高（>=70%）
        // 2. 及格率过低（<60%）
        const isAnomaly = excellentRate >= 0.7 || passRate < 0.6;
        
        return {
            courseCode: gradeData.courseCode,
            courseName: gradeData.courseName,
            teacher: gradeData.teacher,
            studentCount: gradeData.studentCount,
            average,
            excellentRate,
            passRate,
            isAnomaly,
            published: gradeData.published || false
        };
    },

    // 学生成绩异常监控（PDF要求）
    loadStudentAnomalyAnalysis() {
        const students = this.getData(this.STORAGE_KEYS.STUDENTS);
        const historyGrades = JSON.parse(localStorage.getItem('student_history_grades') || '{}');
        
        // 为每个学生设定本学期的固定平均分（模拟真实场景）
        const currentSemesterAverages = {
            'S2021001': 88,   // 正常：历史86.5 → 本学期88（+1.5）
            'S2021002': 78,   // 异常突增：历史56.5 → 本学期78（+21.5）⭐
            'S2021003': 85,   // 异常突增：历史62 → 本学期85（+23）⭐
            'S2021004': 68,   // 异常下滑：历史91 → 本学期68（-23）⭐
            'S2021005': 62,   // 异常下滑：历史87 → 本学期62（-25）⭐
            'S2022001': 52,   // 正常波动：历史70 → 本学期52（-18）
            'S2022002': 88,   // 异常突增：历史65 → 本学期88（+23）⭐
            'S2022003': 81    // 正常波动：历史79 → 本学期81（+2）
        };
        
        const anomalyStudents = [];
        
        // 分析学生成绩波动
        students.slice(0, 8).forEach(student => {
            const history = historyGrades[student.id];
            const currentAverage = currentSemesterAverages[student.id];
            
            if (history && currentAverage !== undefined) {
                const fluctuation = currentAverage - history.average;
                
                // 波动超过±20分视为异常
                const isAnomaly = Math.abs(fluctuation) > 20;
                
                anomalyStudents.push({
                    id: student.id,
                    name: student.name,
                    historyAverage: history.average.toFixed(1),
                    currentAverage: currentAverage.toFixed(1),
                    fluctuation: fluctuation.toFixed(1),
                    isAnomaly
                });
            }
        });
        
        // 更新异常学生统计
        const anomalyCount = anomalyStudents.filter(s => s.isAnomaly).length;
        document.getElementById('statAnomalyStudents').textContent = anomalyCount;
        
        // 渲染学生异常表格
        const tbody = document.getElementById('studentAnomalyTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = anomalyStudents.map(s => {
            const rowClass = s.isAnomaly ? 'anomaly-row' : '';
            const anomalyBadge = s.isAnomaly 
                ? (parseFloat(s.fluctuation) > 0 
                    ? '<span class="tag tag-warning">异常：成绩突增</span>' 
                    : '<span class="tag tag-danger">异常：成绩下滑</span>')
                : '<span class="tag tag-success">正常</span>';
            
            const fluctuationColor = parseFloat(s.fluctuation) > 0 ? 'var(--success-color)' : 'var(--danger-color)';
            
            return `
                <tr class="${rowClass}">
                    <td>${s.id}</td>
                    <td>${s.name}</td>
                    <td>${s.historyAverage}</td>
                    <td>${s.currentAverage}</td>
                    <td style="color: ${fluctuationColor}; font-weight: 600;">${parseFloat(s.fluctuation) > 0 ? '+' : ''}${s.fluctuation}</td>
                    <td>${anomalyBadge}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;">查看详情</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // 刷新成绩分析
    refreshGradeAnalysis() {
        this.loadGrades();
        this.showToast('🔄 数据已刷新');
    },

    // 查看成绩详情
    viewGradeDetails(courseCode) {
        const grades = this.getData(this.STORAGE_KEYS.GRADES);
        const course = grades.find(g => g.courseCode === courseCode);
        
        if (!course) return;
        
        const analysis = this.analyzeCourseGrades(course);
        
        document.getElementById('modalTitle').textContent = `成绩详情 - ${course.courseName}`;
        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4 style="font-size: 16px; margin-bottom: 12px; color: var(--secondary-text);">统计信息</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    <div><strong>课程代码：</strong>${course.courseCode}</div>
                    <div><strong>授课教师：</strong>${course.teacher}</div>
                    <div><strong>学生人数：</strong>${course.studentCount}</div>
                    <div><strong>平均分：</strong>${analysis.average.toFixed(2)}</div>
                    <div><strong>优秀率：</strong>${(analysis.excellentRate * 100).toFixed(1)}%</div>
                    <div><strong>及格率：</strong>${(analysis.passRate * 100).toFixed(1)}%</div>
                </div>
            </div>
            ${analysis.isAnomaly ? `
                <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                    <strong style="color: #856404;">⚠️ 异常提示：</strong>
                    <p style="margin: 8px 0 0; color: #856404; font-size: 14px;">
                        ${analysis.excellentRate >= 0.7 ? '该课程优秀率过高，建议审核试卷难度和评分标准。' : ''}
                        ${analysis.passRate < 0.6 ? '该课程及格率过低，建议核查教学内容和学生学习情况。' : ''}
                    </p>
                </div>
            ` : ''}
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="eduAdmin.closeModal()">关闭</button>
                ${!course.published ? `<button class="btn btn-primary" onclick="eduAdmin.publishGrade('${courseCode}')">发布成绩</button>` : ''}
            </div>
        `;
        document.getElementById('modalOverlay').classList.add('active');
    },

    // 发布单门课程成绩
    publishGrade(courseCode) {
        if (confirm(`确定要发布 ${courseCode} 的成绩吗？发布后学生可立即查看。`)) {
            const grades = this.getData(this.STORAGE_KEYS.GRADES);
            const course = grades.find(g => g.courseCode === courseCode);
            
            if (course) {
                course.published = true;
                this.saveData(this.STORAGE_KEYS.GRADES, grades);
                
                this.closeModal();
                this.loadGrades();
                this.showToast(`✅ ${course.courseName} 成绩已发布`);
            }
        }
    },

    // 批量发布所有成绩
    publishAllGrades() {
        const grades = this.getData(this.STORAGE_KEYS.GRADES);
        const unpublished = grades.filter(g => !g.published);
        
        if (unpublished.length === 0) {
            alert('所有成绩已发布！');
            return;
        }
        
        if (confirm(`确定要批量发布 ${unpublished.length} 门课程的成绩吗？`)) {
            grades.forEach(g => {
                g.published = true;
            });
            this.saveData(this.STORAGE_KEYS.GRADES, grades);
            
            this.loadGrades();
            this.showToast(`✅ 成功发布 ${unpublished.length} 门课程的成绩`);
        }
    },

    // ==================== 工具方法 ====================
    
    // 获取数据
    getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    // 保存数据
    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // 显示Toast通知
    showToast(message, duration = 3000) {
        const toast = document.getElementById('toastNotification');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },

    // 关闭模态框
    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    eduAdmin.init();
});
