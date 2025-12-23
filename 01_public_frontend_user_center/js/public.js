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
        const allCourses = DB.get('courses');
        const publishedCourses = allCourses.filter(c => c.status === 'published');
        
        // Statistics
        const stats = {
            courses: allCourses.length,
            users: DB.get('users').length,
            enrollments: DB.get('enrollments').length
        };

        // Extract unique departments and credits for filters
        const depts = [...new Set(publishedCourses.map(c => c.dept))].sort();
        const credits = [...new Set(publishedCourses.map(c => c.credit))].sort((a, b) => a - b);

        container.innerHTML = `
            <div class="hero-section">
                <h1 class="hero-title">成绩管理教学平台</h1>
                <p class="hero-subtitle">高效、便捷、专业的教学教务管理系统</p>
                ${!this.state.currentUser ? `<button class="btn btn-primary" onclick="app.showLoginModal()" style="padding: 12px 30px; font-size: 18px;">立即登录</button>` : ''}
            </div>
            
            <!-- Data Dashboard -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; padding: 0 10px;">
                <div class="card" style="text-align: center; padding: 25px; margin-bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #0066cc; margin-bottom: 5px; line-height: 1.2;">${stats.courses}</div>
                    <div style="color: #86868b; font-size: 14px; font-weight: 500;">开设课程</div>
                </div>
                <div class="card" style="text-align: center; padding: 25px; margin-bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #34c759; margin-bottom: 5px; line-height: 1.2;">${stats.users}</div>
                    <div style="color: #86868b; font-size: 14px; font-weight: 500;">师生总数</div>
                </div>
                <div class="card" style="text-align: center; padding: 25px; margin-bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #ff9500; margin-bottom: 5px; line-height: 1.2;">${stats.enrollments}</div>
                    <div style="color: #86868b; font-size: 14px; font-weight: 500;">累计选课</div>
                </div>
            </div>

            <!-- News Ticker -->
            <div class="card" style="margin-bottom: 30px; padding: 15px 20px; display: flex; align-items: center; gap: 15px;">
                <div style="background: #eef2f5; padding: 4px 8px; border-radius: 4px; color: #555; font-size: 12px; font-weight: 600; white-space: nowrap;">
                    📢 系统公告
                </div>
                <div style="flex: 1; overflow: hidden; height: 24px; position: relative;">
                    <div id="news-ticker" style="position: absolute; width: 100%; transition: transform 0.5s ease;">
                        <div style="height: 24px; line-height: 24px; color: #333; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">🎉 欢迎使用全新升级的成绩管理教学平台！</div>
                        <div style="height: 24px; line-height: 24px; color: #333; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">⚠️ 2026春季学期选课将于下周一正式开始，请同学们做好准备。</div>
                        <div style="height: 24px; line-height: 24px; color: #333; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">🔧 系统将于本周五晚22:00-24:00进行例行维护，届时可能无法访问。</div>
                        <div style="height: 24px; line-height: 24px; color: #333; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">💡 提示：首次登录请及时修改初始密码，保障账户安全。</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 10px;">
                    <h3 class="card-title">热门课程</h3>
                    <div style="display: flex; gap: 10px;">
                        <select id="deptFilter" class="form-input" style="width: 150px;" onchange="app.filterPublicCourses()">
                            <option value="">所有院系</option>
                            ${depts.map(d => `<option value="${d}">${d}</option>`).join('')}
                        </select>
                        <select id="creditFilter" class="form-input" style="width: 120px;" onchange="app.filterPublicCourses()">
                            <option value="">所有学分</option>
                            ${credits.map(c => `<option value="${c}">${c} 学分</option>`).join('')}
                        </select>
                        <input type="text" id="keywordFilter" placeholder="搜索课程名/编号..." class="form-input" style="width: 200px;" oninput="app.filterPublicCourses()">
                    </div>
                </div>
                <div id="publicCourseList">
                    ${this.renderCourseCards(publishedCourses)}
                </div>
            </div>

            <!-- Chat Widget Button -->
            <div id="chat-widget-btn" onclick="app.toggleChat()" style="position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: #0066cc; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 1000; transition: transform 0.3s; color: white;">
                <span style="font-size: 30px;">💬</span>
            </div>

            <!-- Chat Window -->
            <div id="chat-window" style="position: fixed; bottom: 100px; right: 30px; width: 320px; height: 450px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); display: none; flex-direction: column; overflow: hidden; z-index: 1000; border: 1px solid #eee;">
                <div style="background: #0066cc; color: white; padding: 15px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                    <span>在线客服</span>
                    <span onclick="app.toggleChat()" style="cursor: pointer; font-size: 20px;">×</span>
                </div>
                <div id="chat-messages" style="flex: 1; padding: 15px; overflow-y: auto; background: #f9f9f9;">
                    <div style="margin-bottom: 15px; display: flex;">
                        <div style="width: 32px; height: 32px; background: #ddd; border-radius: 50%; margin-right: 10px; flex-shrink: 0; display: flex; justify-content: center; align-items: center;">🤖</div>
                        <div style="background: white; padding: 10px 15px; border-radius: 0 12px 12px 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); max-width: 80%; font-size: 14px; line-height: 1.4;">
                            您好！我是您的智能助手。请问有什么可以帮您？
                        </div>
                    </div>
                    <div id="chat-options" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                        <button onclick="app.sendChatMessage('如何重置密码？')" style="background: white; border: 1px solid #0066cc; color: #0066cc; padding: 5px 10px; border-radius: 15px; font-size: 12px; cursor: pointer;">如何重置密码？</button>
                        <button onclick="app.sendChatMessage('选课时间是什么时候？')" style="background: white; border: 1px solid #0066cc; color: #0066cc; padding: 5px 10px; border-radius: 15px; font-size: 12px; cursor: pointer;">选课时间是什么时候？</button>
                        <button onclick="app.sendChatMessage('如何联系管理员？')" style="background: white; border: 1px solid #0066cc; color: #0066cc; padding: 5px 10px; border-radius: 15px; font-size: 12px; cursor: pointer;">如何联系管理员？</button>
                    </div>
                </div>
                <div style="padding: 10px; border-top: 1px solid #eee; background: white;">
                    <input type="text" id="chat-input" placeholder="输入您的问题..." style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 14px;" onkeypress="if(event.key === 'Enter') { app.sendChatMessage(this.value); this.value = ''; }">
                </div>
            </div>

            <!-- Footer -->
            <footer style="text-align: center; padding: 40px 0; color: #86868b; font-size: 13px; border-top: 1px solid #e5e5e5; margin-top: 40px;">
                <div style="margin-bottom: 10px;">
                    <a href="#" style="color: #555; text-decoration: none; margin: 0 10px;">关于我们</a> | 
                    <a href="#" style="color: #555; text-decoration: none; margin: 0 10px;">联系方式</a> | 
                    <a href="#" style="color: #555; text-decoration: none; margin: 0 10px;">帮助中心</a> | 
                    <a href="#" style="color: #555; text-decoration: none; margin: 0 10px;">隐私政策</a>
                </div>
                <p>&copy; 2024 成绩管理教学平台 (Educational Administration System). All rights reserved.</p>
                <p style="margin-top: 5px;">地址：科技大道888号 | 电话：0755-88888888 | 邮箱：support@edu.admin</p>
            </footer>
        `;

        // Start news ticker
        this.startNewsTicker();
    },

    toggleChat() {
        const win = document.getElementById('chat-window');
        const btn = document.getElementById('chat-widget-btn');
        if (win.style.display === 'none' || win.style.display === '') {
            win.style.display = 'flex';
            btn.style.transform = 'scale(0)';
            // Focus input
            setTimeout(() => document.getElementById('chat-input').focus(), 100);
        } else {
            win.style.display = 'none';
            btn.style.transform = 'scale(1)';
        }
    },

    sendChatMessage(msg) {
        if (!msg.trim()) return;
        const chatMessages = document.getElementById('chat-messages');
        const options = document.getElementById('chat-options');

        // Append User Message
        const userMsgHTML = `
            <div style="margin-bottom: 15px; display: flex; justify-content: flex-end;">
                <div style="background: #0066cc; color: white; padding: 10px 15px; border-radius: 12px 12px 0 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); max-width: 80%; font-size: 14px; line-height: 1.4;">
                    ${msg}
                </div>
            </div>
        `;
        // Insert before options
        options.insertAdjacentHTML('beforebegin', userMsgHTML);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Simulate Reply
        setTimeout(() => {
            let reply = '抱歉，我不明白您的问题。建议您联系人工客服。';
            if (msg.includes('密码')) reply = '您可以在登录页面点击“忘记密码”进行重置。重置需要验证您的注册邮箱。';
            else if (msg.includes('选课')) reply = '2024秋季学期选课将于9月1日正式开始，请留意系统公告。';
            else if (msg.includes('管理员')) reply = '管理员联系邮箱：support@edu.admin，或致电 0755-88888888。';
            else if (msg.includes('你好') || msg.includes('您好')) reply = '您好！有什么可以帮您的吗？';

            const botMsgHTML = `
                <div style="margin-bottom: 15px; display: flex;">
                    <div style="width: 32px; height: 32px; background: #ddd; border-radius: 50%; margin-right: 10px; flex-shrink: 0; display: flex; justify-content: center; align-items: center;">🤖</div>
                    <div style="background: white; padding: 10px 15px; border-radius: 0 12px 12px 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); max-width: 80%; font-size: 14px; line-height: 1.4;">
                        ${reply}
                    </div>
                </div>
            `;
            options.insertAdjacentHTML('beforebegin', botMsgHTML);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 600);
    },

    startNewsTicker() {
        const ticker = document.getElementById('news-ticker');
        if (!ticker) return;

        let currentIndex = 0;
        const items = ticker.children;
        const itemCount = items.length;

        // Clone first item to end for seamless looping (optional logic, but simple cycling is fine for now)
        // For simple vertical slide:
        setInterval(() => {
            currentIndex++;
            if (currentIndex >= itemCount) {
                currentIndex = 0;
                ticker.style.transition = 'none'; // Disable transition for instant jump
                ticker.style.transform = `translateY(0)`;
                // Force reflow
                void ticker.offsetWidth;
                // Next tick will animate to index 1
                return; // Skip this interval to reset
            }
            
            ticker.style.transition = 'transform 0.5s ease';
            ticker.style.transform = `translateY(-${currentIndex * 24}px)`;
        }, 3000);
    },

    renderCourseCards(courses) {
        if (courses.length === 0) return '<div style="padding:20px; text-align:center; color:#888;">暂无课程</div>';

        return `
            <div style="max-height: 740px; overflow-y: auto; padding-right: 5px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                    ${courses.map(c => `
                        <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; background: #fafafa; height: 100%; box-sizing: border-box;">
                            <h4 style="font-size:18px; margin-bottom:8px;">${c.name}</h4>
                            <div style="color:#666; font-size:14px; margin-bottom:12px;">
                                <span style="background:#eee; padding:2px 6px; border-radius:4px;">${c.id}</span>
                                <span style="margin-left:8px;">${c.teacherName}</span>
                                <span style="float:right;">${c.credit} 学分</span>
                            </div>
                            <div style="font-size:12px; color:#555; margin-bottom:8px; padding: 4px 8px; background: #eef2f5; border-radius: 4px; display: inline-block;">${c.dept}</div>
                            <p style="font-size:13px; color:#888; margin-bottom:15px; height: 40px; overflow:hidden;">${c.desc}</p>
                            <div style="font-size:12px; color:#555; margin-bottom:5px;">${c.schedule} | ${c.classroom}</div>
                            <div style="font-size:12px; color:#666; font-style: italic;">要求: ${c.requirements || '无'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    filterPublicCourses() {
        const keyword = document.getElementById('keywordFilter').value.trim();
        const dept = document.getElementById('deptFilter').value;
        const credit = document.getElementById('creditFilter').value;

        const courses = DB.get('courses').filter(c => {
            if (c.status !== 'published') return false;
            
            // Filter by Dept
            if (dept && c.dept !== dept) return false;

            // Filter by Credit
            if (credit && String(c.credit) !== credit) return false;

            // Filter by Keyword
            if (keyword) {
                return c.name.includes(keyword) || 
                       c.id.includes(keyword) || 
                       c.dept.includes(keyword) ||
                       String(c.credit).includes(keyword);
            }
            
            return true;
        });
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

