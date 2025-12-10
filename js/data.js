// 简单的 Mock 哈希函数 (模拟加盐哈希)
const Security = {
    hash(password, salt) {
        // 简单演示：将 salt + password 进行 Base64 编码模拟哈希
        // 实际生产环境应使用 SHA-256 或 bcrypt
        return btoa(encodeURIComponent(salt + password));
    }
};

const MockData = {
    users: [
        { id: 'S001', name: '张三', role: 'student', passwordHash: Security.hash('password', 'S001'), salt: 'S001', email: 'zhangsan@szu.edu.cn', class: '2021级计算机1班', loginAttempts: 0, lockUntil: 0 },
        { id: 'S002', name: '李四', role: 'student', passwordHash: Security.hash('password', 'S002'), salt: 'S002', email: 'lisi@szu.edu.cn', class: '2021级计算机1班', loginAttempts: 0, lockUntil: 0 },
        { id: 'T001', name: '王老师', role: 'teacher', passwordHash: Security.hash('password', 'T001'), salt: 'T001', email: 'wang@szu.edu.cn', loginAttempts: 0, lockUntil: 0 },
        { id: 'T002', name: '赵老师', role: 'teacher', passwordHash: Security.hash('password', 'T002'), salt: 'T002', email: 'zhao@szu.edu.cn', loginAttempts: 0, lockUntil: 0 },
        { id: 'TA001', name: '教学秘书', role: 'edu_admin', passwordHash: Security.hash('password', 'TA001'), salt: 'TA001', email: 'sec@szu.edu.cn', loginAttempts: 0, lockUntil: 0 },
        { id: 'SA001', name: '系统管理员', role: 'sys_admin', passwordHash: Security.hash('password', 'SA001'), salt: 'SA001', email: 'admin@szu.edu.cn', loginAttempts: 0, lockUntil: 0 }
    ],
    courses: [
        { 
            id: 'C001', 
            name: 'Web前端开发', 
            credit: 3, 
            teacherId: 'T001', 
            teacherName: '王老师',
            dept: '计算机与软件学院', 
            desc: '本课程介绍HTML5, CSS3, JS基础。',
            status: 'published', // draft, published
            schedule: '周一 3-4节',
            classroom: 'N201'
        },
        { 
            id: 'C002', 
            name: '数据结构', 
            credit: 4, 
            teacherId: 'T002', 
            teacherName: '赵老师',
            dept: '计算机与软件学院', 
            desc: '计算机专业核心课程。',
            status: 'published',
            schedule: '周二 1-2节',
            classroom: 'S304'
        },
        { 
            id: 'C003', 
            name: '高等数学', 
            credit: 5, 
            teacherId: 'T001', 
            teacherName: '王老师',
            dept: '数学学院', 
            desc: '理工科基础课程。',
            status: 'published',
            schedule: '周三 3-4节',
            classroom: 'H101'
        }
    ],
    enrollments: [
        // Grades: null means not yet graded
        { studentId: 'S001', courseId: 'C001', grade: 88, details: { homework: 90, midterm: 85, final: 88 } },
        { studentId: 'S001', courseId: 'C002', grade: null, details: { homework: null, midterm: null, final: null } },
        { studentId: 'S002', courseId: 'C001', grade: 75, details: { homework: 80, midterm: 70, final: 75 } }
    ],
    logs: [
        { id: 1, user: 'SA001', action: 'System Backup', time: '2023-10-01 12:00:00' },
        { id: 2, user: 'TA001', action: 'Create Course C001', time: '2023-09-01 09:00:00' }
    ]
};

// 简单的本地存储封装，模拟数据库持久化
const DB = {
    init() {
        if (!localStorage.getItem('grade_users')) {
            localStorage.setItem('grade_users', JSON.stringify(MockData.users));
        }
        if (!localStorage.getItem('grade_courses')) {
            localStorage.setItem('grade_courses', JSON.stringify(MockData.courses));
        }
        if (!localStorage.getItem('grade_enrollments')) {
            localStorage.setItem('grade_enrollments', JSON.stringify(MockData.enrollments));
        }
        if (!localStorage.getItem('grade_logs')) {
            localStorage.setItem('grade_logs', JSON.stringify(MockData.logs));
        }
    },
    get(table) {
        return JSON.parse(localStorage.getItem('grade_' + table)) || [];
    },
    set(table, data) {
        localStorage.setItem('grade_' + table, JSON.stringify(data));
    },
    // Helper to find user and authenticate
    login(username, password) {
        const users = this.get('users');
        const userIndex = users.findIndex(u => u.id === username);
        
        if (userIndex === -1) {
            return { success: false, error: '用户不存在' };
        }

        const user = users[userIndex];

        // Check lock
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return { success: false, error: `账号已锁定，请 ${minutesLeft} 分钟后再试` };
        }

        // Check password
        const inputHash = Security.hash(password, user.salt || username); // Fallback to username if salt missing in old data
        
        if (user.passwordHash === inputHash) {
            // Success
            user.loginAttempts = 0;
            user.lockUntil = 0;
            users[userIndex] = user;
            this.set('users', users);
            return { success: true, user: user };
        } else {
            // Fail
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts >= 3) {
                user.lockUntil = Date.now() + 5 * 60 * 1000; // Lock for 5 mins
                users[userIndex] = user;
                this.set('users', users);
                return { success: false, error: '密码错误次数过多，账号已锁定5分钟' };
            }
            users[userIndex] = user;
            this.set('users', users);
            return { success: false, error: `密码错误 (剩余尝试次数: ${3 - user.loginAttempts})` };
        }
    }
};

DB.init();
