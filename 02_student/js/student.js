Object.assign(app, {
    renderStudentDashboard() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <h2 style="margin-bottom:20px;">学生工作台</h2>
            <div style="display:flex; gap:20px; margin-bottom:20px;">
                <button class="btn btn-primary" onclick="app.renderStudentMyCourses()">我的课程</button>
                <button class="btn btn-secondary" onclick="app.renderStudentAllCourses()">选课中心</button>
                <button class="btn btn-secondary" onclick="app.renderStudentGrades()">成绩单</button>
            </div>
            <div id="studentContent"></div>
        `;
        this.renderStudentMyCourses();
    },

    renderStudentMyCourses() {
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
                    <thead><tr><th>课程号</th><th>课程名</th><th>教师</th><th>学分</th><th>状态</th></tr></thead>
                    <tbody>
                        ${myCourses.map(c => `
                            <tr>
                                <td>${c.id}</td>
                                <td>${c.name}</td>
                                <td>${c.teacherName}</td>
                                <td>${c.credit}</td>
                                <td><span style="color:${c.grade ? '#34c759' : '#0066cc'}">${c.grade ? '已结课' : '进行中'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    },

    renderStudentAllCourses() {
        const courses = DB.get('courses').filter(c => c.status === 'published');
        const enrollments = DB.get('enrollments').filter(e => e.studentId === this.state.currentUser.id);
        const enrolledIds = enrollments.map(e => e.courseId);

        const html = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">选课中心</h3></div>
                <table class="data-table">
                    <thead><tr><th>课程号</th><th>课程名</th><th>教师</th><th>时间</th><th>操作</th></tr></thead>
                    <tbody>
                        ${courses.map(c => {
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
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    },

    enrollCourse(courseId) {
        if (!confirm('确定要选修这门课程吗？')) return;

        const enrollments = DB.get('enrollments');
        enrollments.push({
            studentId: this.state.currentUser.id,
            courseId: courseId,
            grade: null,
            details: { homework: null, midterm: null, final: null }
        });
        DB.set('enrollments', enrollments);
        this.showToast('选课成功！');
        this.renderStudentAllCourses();
    },

    renderStudentGrades() {
        const enrollments = DB.get('enrollments').filter(e => e.studentId === this.state.currentUser.id && e.grade !== null);
        const courses = DB.get('courses');

        const html = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">我的成绩单</h3></div>
                <table class="data-table">
                    <thead><tr><th>课程</th><th>学分</th><th>平时分</th><th>期中</th><th>期末</th><th>总评</th></tr></thead>
                    <tbody>
                        ${enrollments.map(e => {
                            const c = courses.find(course => course.id === e.courseId);
                            return `
                                <tr>
                                    <td>${c.name}</td>
                                    <td>${c.credit}</td>
                                    <td>${e.details.homework || '-'}</td>
                                    <td>${e.details.midterm || '-'}</td>
                                    <td>${e.details.final || '-'}</td>
                                    <td style="font-weight:bold; color:#0066cc;">${e.grade}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('studentContent').innerHTML = html;
    }
});

