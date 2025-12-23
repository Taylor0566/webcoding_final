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

    showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    },

    hideLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('loginForm').reset();
    },

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const result = await DB.login(username, password);
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
        } catch (err) {
            alert(err && err.message ? err.message : '登录失败');
        }
    },

    async handleChangePassword(e) {
        e.preventDefault();
        const newPassword = document.getElementById('cpNewPassword').value;
        const confirmPassword = document.getElementById('cpConfirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        if (newPassword.length < 6) {
            alert('密码长度不能少于6位');
            return;
        }

        if (!this.state.pendingUser) {
            alert('用户状态异常，请重新登录');
            document.getElementById('changePasswordModal').classList.remove('active');
            this.showLoginModal();
            return;
        }

        const result = await DB.changePassword(this.state.pendingUser.id, newPassword);
        if (result.success) {
            alert('密码修改成功');
            document.getElementById('changePasswordModal').classList.remove('active');
            
            // Login the user properly
            // We need to fetch the updated user from DB because resetPassword/changePassword updates it
            const updatedUser = DB.findUser(this.state.pendingUser.id);
            this.state.currentUser = updatedUser;
            this.state.pendingUser = null;
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.updateNav();
            this.showToast(`欢迎回来，${updatedUser.name} (${this.getRoleName(updatedUser.role)})`);
            this.renderDashboard();
        } else {
            alert('密码修改失败: ' + result.error);
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
                    <input type="text" placeholder="搜索课程名/编号/院系/学分..." class="form-input" style="width: 250px;" oninput="app.filterPublicCourses(this.value)">
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
                        <div style="font-size:12px; color:#555; margin-bottom:5px;">${c.schedule} | ${c.classroom}</div>
                        <div style="font-size:12px; color:#666; font-style: italic;">要求: ${c.requirements || '无'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    filterPublicCourses(keyword) {
        const courses = DB.get('courses').filter(c =>
            c.status === 'published' &&
            (
                c.name.includes(keyword) || 
                c.id.includes(keyword) || 
                c.dept.includes(keyword) ||
                String(c.credit).includes(keyword)
            )
        );
        document.getElementById('publicCourseList').innerHTML = this.renderCourseCards(courses);
    },

    showForgotPasswordModal() {
        this.hideLoginModal();
        document.getElementById('forgotPasswordModal').classList.add('active');
        document.getElementById('fpStep1').style.display = 'block';
        document.getElementById('fpStep2').style.display = 'none';
        document.getElementById('forgotPasswordForm').reset();
    },

    hideForgotPasswordModal() {
        document.getElementById('forgotPasswordModal').classList.remove('active');
    },

    verifyUserAndSendCode() {
        const username = document.getElementById('fpUsername').value;
        if (!username) {
            alert('请输入账号');
            return;
        }

        const user = DB.findUser(username);
        if (!user) {
            alert('账号不存在');
            return;
        }

        if (!user.email) {
            alert('该账号未绑定邮箱，无法重置密码，请联系管理员。');
            return;
        }

        // Simulate sending email
        const code = Math.floor(100000 + Math.random() * 900000);
        this.state.resetCode = String(code);
        this.state.resetUser = username;

        alert(`模拟邮件发送：\n您的验证码是：${code}\n发送至：${user.email}`);
        
        document.getElementById('fpStep1').style.display = 'none';
        document.getElementById('fpStep2').style.display = 'block';
    },

    async handleForgotPassword(e) {
        e.preventDefault();
        const code = document.getElementById('fpCode').value;
        const newPassword = document.getElementById('fpNewPassword').value;

        if (code !== this.state.resetCode) {
            alert('验证码错误');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            alert('新密码长度不能少于6位');
            return;
        }

        const result = await DB.resetPassword(this.state.resetUser, newPassword);
        if (result.success) {
            alert('密码重置成功，请重新登录');
            this.hideForgotPasswordModal();
            this.showLoginModal();
        } else {
            alert('密码重置失败: ' + result.error);
        }
    },

    renderDashboard() {
        const user = this.state.currentUser;
        if (!user) return this.renderHome();

        if (user.role === 'student') this.renderStudentDashboard();
        else if (user.role === 'teacher') this.renderTeacherDashboard();
        else if (user.role === 'edu_admin') this.renderEduAdminDashboard();
        else if (user.role === 'sys_admin') this.renderSysAdminDashboard();
    },

    showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.style.display = 'block';
        setTimeout(() => t.style.display = 'none', 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

