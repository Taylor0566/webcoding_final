Object.assign(app, {
  // ==================== 初始化 ====================
  renderEduAdminDashboard() {
    const container = document.getElementById("app");
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
    const navIds = [
      "nav-edu-dashboard",
      "nav-edu-students",
      "nav-edu-teachers",
      "nav-edu-courses",
      "nav-edu-classes",
      "nav-edu-schedules",
      "nav-edu-grades",
    ];
    navIds.forEach((id) => {
      const btn = document.getElementById(id);
      if (btn)
        btn.className =
          id === activeId ? "btn btn-primary" : "btn btn-secondary";
    });
  },

  showEduToast(message) {
    this.showToast(message);
  },

  // ==================== 工作台 ====================
  renderEduAdminHome() {
    this.updateEduAdminNav("nav-edu-dashboard");

    const students = DB.get("users").filter((u) => u.role === "student");
    const teachers = DB.get("users").filter((u) => u.role === "teacher");
    const courses = DB.get("courses");
    const enrollments = DB.get("enrollments");

    const gradedCount = enrollments.filter((e) => e.grade !== null).length;
    const pendingCount = enrollments.filter((e) => e.grade === null).length;

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
                    <button class="btn btn-secondary" style="padding:15px; background:#f0f9ff; color:#0066cc;" onclick="app.showSystemSyncInfo()">📖 系统联动说明</button>
                </div>
            </div>
        `;

    document.getElementById("eduAdminContent").innerHTML = html;
  },

  // ==================== 学生管理 ====================
  renderEduAdminStudents() {
    this.updateEduAdminNav("nav-edu-students");

    const students = DB.get("users").filter((u) => u.role === "student");
    const enrollments = DB.get("enrollments");

    const html = `
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">学生列表</h3>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="studentSearchInput" placeholder="搜索学号/姓名..." 
                            style="padding:8px; border:1px solid #ddd; border-radius:4px; width:200px;"
                            oninput="app.searchEduStudents(this.value)">
                        <button class="btn btn-primary" onclick="app.showAddStudentModal()">添加学生</button>
                        <button class="btn btn-secondary" onclick="app.showImportStudentsModal()">批量导入</button>
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

    document.getElementById("eduAdminContent").innerHTML = html;
  },

  renderStudentRows(students, enrollments) {
    if (students.length === 0) {
      return '<tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">暂无学生数据</td></tr>';
    }

    return students
      .map((s) => {
        const courseCount = enrollments.filter(
          (e) => e.studentId === s.id
        ).length;
        const hasMajor = s.major && s.major.trim();
        return `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.name}</td>
                    <td>${
                      s.class || '<span style="color:#999;">未分配</span>'
                    }</td>
                    <td>${
                      hasMajor
                        ? s.major
                        : '<span style="color:#ff9800;">待完善</span>'
                    }</td>
                    <td>${courseCount}</td>
                    <td>
                        <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                            <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px; white-space:nowrap;" onclick="app.viewStudentCourses('${
                              s.id
                            }')">课程表</button>
                            <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px; white-space:nowrap;" onclick="app.editStudent('${
                              s.id
                            }')">编辑</button>
                            <button class="btn btn-danger" style="padding:4px 10px; font-size:12px; white-space:nowrap;" onclick="app.deleteStudent('${
                              s.id
                            }')">删除</button>
                        </div>
                    </td>
                </tr>
            `;
      })
      .join("");
  },

  searchEduStudents(keyword) {
    const allStudents = DB.get("users").filter((u) => u.role === "student");
    const enrollments = DB.get("enrollments");

    const filtered = allStudents.filter(
      (s) =>
        s.id.toLowerCase().includes(keyword.toLowerCase()) ||
        s.name.toLowerCase().includes(keyword.toLowerCase()) ||
        (s.class && s.class.toLowerCase().includes(keyword.toLowerCase()))
    );

    document.getElementById("studentsTableBody").innerHTML =
      this.renderStudentRows(filtered, enrollments);
  },

  viewStudentCourses(studentId) {
    const student = DB.get("users").find((u) => u.id === studentId);
    const enrollments = DB.get("enrollments").filter(
      (e) => e.studentId === studentId
    );
    const courses = DB.get("courses");

    const courseList = enrollments.map((e) => {
      const course = courses.find((c) => c.id === e.courseId);
      return {
        ...course,
        schedule: course ? course.schedule : "未排课",
        classroom: course ? course.classroom : "-",
      };
    });

    const modalContent = `
            <h4 style="margin-bottom:15px;">${
              student.name
            }（${studentId}）的课程表</h4>
            ${
              courseList.length > 0
                ? `
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
                        ${courseList
                          .map(
                            (c) => `
                            <tr>
                                <td>${c.id}</td>
                                <td>${c.name}</td>
                                <td>${c.teacherName}</td>
                                <td>${c.schedule}</td>
                                <td>${c.classroom}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
                <div style="margin-top:15px; color:#666; font-size:14px;">
                    总学分：<strong>${courseList.reduce(
                      (sum, c) => sum + (c.credit || 0),
                      0
                    )}</strong> | 
                    已选课程：<strong>${courseList.length}</strong>门
                </div>
            `
                : '<div style="text-align:center; padding:40px; color:#888;">该学生尚未选课</div>'
            }
        `;

    this.showEduModal("学生课程表", modalContent);
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

    this.showEduModal("添加学生", modalContent);
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
            lockUntil: 0,
            mustChangePassword: true
        };
        
        users.push(newStudent);
        DB.set('users', users);
        
        this.closeEduModal();
        this.showEduToast('✅ 添加成功');
        this.renderEduAdminStudents();
    },

  editStudent(studentId) {
    const student = DB.get("users").find((u) => u.id === studentId);
    if (!student) return;

    const modalContent = `
            <form onsubmit="app.handleEditStudent(event, '${studentId}')">
                <div class="form-group">
                    <label class="form-label">学号</label>
                    <input type="text" class="form-input" value="${
                      student.id
                    }" readonly style="background:#f5f5f5;">
                </div>
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input type="text" id="editStudentName" class="form-input" value="${
                      student.name
                    }" required>
                </div>
                <div class="form-group">
                    <label class="form-label">班级</label>
                    <input type="text" id="editStudentClass" class="form-input" value="${
                      student.class || ""
                    }">
                </div>
                <div class="form-group">
                    <label class="form-label">专业</label>
                    <input type="text" id="editStudentMajor" class="form-input" value="${
                      student.major || ""
                    }">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">保存修改</button>
            </form>
        `;

    this.showEduModal("编辑学生信息", modalContent);
  },

  handleEditStudent(e, studentId) {
    e.preventDefault();

    const users = DB.get("users");
    const index = users.findIndex((u) => u.id === studentId);

    if (index !== -1) {
      users[index].name = document
        .getElementById("editStudentName")
        .value.trim();
      users[index].class = document
        .getElementById("editStudentClass")
        .value.trim();
      users[index].major = document
        .getElementById("editStudentMajor")
        .value.trim();

      DB.set("users", users);
      const updatedStudent = users[index];
      DB.log("编辑学生", `学号: ${studentId}, 姓名: ${updatedStudent.name}`); //日志

      this.closeEduModal();
      this.showEduToast("✅ 修改成功");
      this.renderEduAdminStudents();
    }
  },

  deleteStudent(studentId) {
    if (
      !confirm(
        `确定要删除学号为 ${studentId} 的学生吗？\n\n注意：该学生的选课记录也将被删除。`
      )
    )
      return;

    // 获取要删除的学生信息
    const student = DB.get("users").find((u) => u.id === studentId);
    if (!student) return;
    const name = student.name;

    // 删除用户
    let users = DB.get("users");
    users = users.filter((u) => u.id !== studentId);
    DB.set("users", users);

    // 删除选课记录
    let enrollments = DB.get("enrollments");
    enrollments = enrollments.filter((e) => e.studentId !== studentId);
    DB.set("enrollments", enrollments);

    // 删除作业提交
    if (typeof DB.get("submissions") !== "undefined") {
      let submissions = DB.get("submissions");
      submissions = submissions.filter((s) => s.studentId !== studentId);
      DB.set("submissions", submissions);
    }

    DB.log("删除学生", `学号: ${studentId}, 姓名: ${name}`); //日志
    this.showEduToast("✅ 删除成功");
    this.renderEduAdminStudents();
  },

  showImportStudentsModal() {
    const modalContent = `
            <div style="padding: 10px;">
                <div class="alert alert-info" style="background:#e3f2fd; color:#0d47a1; padding:10px; border-radius:4px; margin-bottom:20px; font-size:13px;">
                    <strong>📝 说明：</strong><br>
                    1. 请上传标准格式的 <strong>CSV 文件</strong>（Excel 请“另存为” CSV 格式）。<br>
                    2. 文件需包含表头：<strong>学号, 姓名, 班级</strong>（顺序不限）。<br>
                    3. 初始密码将统一设定，学生首次登录时<strong>必须修改密码</strong>。
                </div>
                
                <form onsubmit="app.handleImportStudents(event)">
                    <div class="form-group">
                        <label class="form-label">选择文件</label>
                        <input type="file" id="importFile" class="form-input" accept=".csv" required>
                        <div style="margin-top:5px; font-size:12px;">
                            <a href="javascript:void(0)" onclick="app.downloadStudentTemplate()" style="color:#2196F3; text-decoration:none;">⬇️ 下载导入模板</a>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">统一初始密码</label>
                        <input type="text" id="initialPassword" class="form-input" value="password" required>
                        <small style="color:#666;">默认为 password，导入后请通知学生。</small>
                    </div>

                    <div id="importResult" style="margin-bottom:15px; display:none;"></div>

                    <button type="submit" id="btnImport" class="btn btn-primary" style="width:100%;">开始导入</button>
                </form>
            </div>
        `;

    this.showEduModal("批量导入学生账号", modalContent);
  },

  downloadStudentTemplate() {
    const csvContent =
      "\uFEFF学号,姓名,班级,专业\nS2024001,张三,2024级计算机1班,计算机科学与技术\nS2024002,李四,2024级软件工程1班,软件工程";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "学生导入模板.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async handleImportStudents(e) {
    e.preventDefault();

    const fileInput = document.getElementById("importFile");
    const file = fileInput.files[0];
    if (!file) return;

    const btn = document.getElementById("btnImport");
    btn.disabled = true;
    btn.innerText = "正在处理...";

    const initialPassword = document
      .getElementById("initialPassword")
      .value.trim();
    if (!initialPassword) {
      alert("请设置初始密码");
      btn.disabled = false;
      btn.innerText = "开始导入";
      return;
    }

    try {
      const text = await this.readFileAsText(file);
      const rows = this.parseCSV(text);

      if (rows.length === 0) {
        throw new Error("文件内容为空或格式不正确");
      }

      // 验证表头
      const headers = rows[0].map((h) => h.trim());
      const idIndex = headers.indexOf("学号");
      const nameIndex = headers.indexOf("姓名");
      const classIndex = headers.indexOf("班级");
      // 专业是可选的，如果没有则尝试找 '专业' 列
      const majorIndex = headers.indexOf("专业");

      if (idIndex === -1 || nameIndex === -1 || classIndex === -1) {
        throw new Error("表头缺失，请确保包含：学号, 姓名, 班级");
      }

      const users = DB.get("users");
      let successCount = 0;
      let failCount = 0;
      const failReasons = [];

      // 准备密码哈希（批量使用相同的初始密码，生成一次即可？不行，每个用户应该有不同的Salt）
      // 如果使用 Security.createPasswordRecord，它会随机生成 Salt。
      // 为了性能，我们逐个生成。

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3) continue; // 跳过空行

        const id = row[idIndex]?.trim();
        const name = row[nameIndex]?.trim();
        const cls = row[classIndex]?.trim();
        const major = majorIndex !== -1 ? row[majorIndex]?.trim() || "" : "";

        if (!id || !name) continue;

        // 检查重复
        if (users.find((u) => u.id === id)) {
          failCount++;
          failReasons.push(`学号 ${id} 已存在`);
          continue;
        }

        // 创建新用户
        let passwordData;
        if (typeof Security !== "undefined" && Security.createPasswordRecord) {
          passwordData = await Security.createPasswordRecord(initialPassword);
        } else {
          // Fallback to legacy
          passwordData = {
            passwordHash: btoa(id + initialPassword), // Simple legacy mock
            salt: id,
            algo: "legacy",
          };
        }

        const newUser = {
          id: id,
          name: name,
          role: "student",
          email: `${id.toLowerCase()}@szu.edu.cn`,
          class: cls,
          major: major,
          passwordHash: passwordData.hash || passwordData.passwordHash,
          salt: passwordData.salt,
          passwordAlgo: passwordData.algo, // 记录算法
          passwordIterations: passwordData.iterations,
          loginAttempts: 0,
          lockUntil: 0,
          mustChangePassword: true, // 强制首次登录修改密码
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        successCount++;
      }

      DB.set("users", users);

      // 显示结果
      const resultDiv = document.getElementById("importResult");
      resultDiv.style.display = "block";
      resultDiv.innerHTML = `
                <div style="padding:10px; background:#f0f9eb; border:1px solid #c2e7b0; color:#3c763d; border-radius:4px;">
                    ✅ 成功导入: <strong>${successCount}</strong> 人
                </div>
                ${
                  failCount > 0
                    ? `
                <div style="margin-top:10px; padding:10px; background:#feb; border:1px solid #faebcc; color:#8a6d3b; border-radius:4px; max-height:100px; overflow-y:auto;">
                    ⚠️ 失败: <strong>${failCount}</strong> 人<br>
                    <ul style="margin:5px 0 0 20px; padding:0; font-size:12px;">
                        ${failReasons.map((r) => `<li>${r}</li>`).join("")}
                    </ul>
                </div>`
                    : ""
                }
            `;

      if (successCount > 0) {
        this.showEduToast(`成功导入 ${successCount} 名学生`);
        this.renderEduAdminStudents(); // 刷新列表
        // 不关闭弹窗，让用户看结果
      }
    } catch (err) {
      alert("导入失败：" + err.message);
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.innerText = "开始导入";
    }
  },

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file, "UTF-8"); // 默认 UTF-8，如果乱码可能需要 GBK
    });
  },

  parseCSV(text) {
    // 简单的 CSV 解析器，处理引号
    const rows = [];
    let currentRow = [];
    let currentCell = "";
    let insideQuote = false;

    // 统一换行符
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          currentCell += '"';
          i++; // 跳过下一个引号
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === "," && !insideQuote) {
        currentRow.push(currentCell);
        currentCell = "";
      } else if (char === "\n" && !insideQuote) {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    if (currentCell) currentRow.push(currentCell);
    if (currentRow.length > 0) rows.push(currentRow);

    return rows;
  },

    importStudentsDemo_OLD() {
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
    this.updateEduAdminNav("nav-edu-teachers");

    const teachers = DB.get("users").filter((u) => u.role === "teacher");
    const courses = DB.get("courses");

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

    document.getElementById("eduAdminContent").innerHTML = html;
  },

  renderTeacherRows(teachers, courses) {
    if (teachers.length === 0) {
      return '<tr><td colspan="5" style="text-align:center; padding:40px; color:#888;">暂无教师数据</td></tr>';
    }

    return teachers
      .map((t) => {
        const courseCount = courses.filter((c) => c.teacherId === t.id).length;
        return `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.name}</td>
                    <td>${t.email || "-"}</td>
                    <td>${courseCount}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding:4px 12px; font-size:12px;" onclick="app.viewTeacherCourses('${
                          t.id
                        }')">查看课程</button>
                        <button class="btn btn-secondary" style="padding:4px 12px; font-size:12px;" onclick="app.editTeacher('${
                          t.id
                        }')">编辑</button>
                        <button class="btn btn-danger" style="padding:4px 12px; font-size:12px;" onclick="app.deleteTeacher('${
                          t.id
                        }')">删除</button>
                    </td>
                </tr>
            `;
      })
      .join("");
  },

  searchEduTeachers(keyword) {
    const allTeachers = DB.get("users").filter((u) => u.role === "teacher");
    const courses = DB.get("courses");

    const filtered = allTeachers.filter(
      (t) =>
        t.id.toLowerCase().includes(keyword.toLowerCase()) ||
        t.name.toLowerCase().includes(keyword.toLowerCase()) ||
        (t.email && t.email.toLowerCase().includes(keyword.toLowerCase()))
    );

    document.getElementById("teachersTableBody").innerHTML =
      this.renderTeacherRows(filtered, courses);
  },

  viewTeacherCourses(teacherId) {
    const teacher = DB.get("users").find((u) => u.id === teacherId);
    const courses = DB.get("courses").filter((c) => c.teacherId === teacherId);

    const modalContent = `
            <h4 style="margin-bottom:15px;">${
              teacher.name
            }（${teacherId}）的授课列表</h4>
            ${
              courses.length > 0
                ? `
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
                        ${courses
                          .map(
                            (c) => `
                            <tr>
                                <td>${c.id}</td>
                                <td>${c.name}</td>
                                <td>${c.credit}</td>
                                <td>${
                                  c.status === "published" ? "已发布" : "草稿"
                                }</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
                <div style="margin-top:15px; color:#666; font-size:14px;">
                    授课总数：<strong>${courses.length}</strong>门
                </div>
            `
                : '<div style="text-align:center; padding:40px; color:#888;">该教师暂未承担课程</div>'
            }
        `;

    this.showEduModal("教师授课列表", modalContent);
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

    this.showEduModal("添加教师", modalContent);
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
            lockUntil: 0,
            mustChangePassword: true
        };
        
        users.push(newTeacher);
        DB.set('users', users);
        
        this.closeEduModal();
        this.showEduToast('✅ 添加成功');
        this.renderEduAdminTeachers();
    },

  editTeacher(teacherId) {
    const teacher = DB.get("users").find((u) => u.id === teacherId);
    if (!teacher) return;

    const modalContent = `
            <form onsubmit="app.handleEditTeacher(event, '${teacherId}')">
                <div class="form-group">
                    <label class="form-label">工号</label>
                    <input type="text" class="form-input" value="${
                      teacher.id
                    }" readonly style="background:#f5f5f5;">
                </div>
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input type="text" id="editTeacherName" class="form-input" value="${
                      teacher.name
                    }" required>
                </div>
                <div class="form-group">
                    <label class="form-label">邮箱</label>
                    <input type="email" id="editTeacherEmail" class="form-input" value="${
                      teacher.email || ""
                    }">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">保存修改</button>
            </form>
        `;

    this.showEduModal("编辑教师信息", modalContent);
  },

  handleEditTeacher(e, teacherId) {
    e.preventDefault();

    const users = DB.get("users");
    const index = users.findIndex((u) => u.id === teacherId);

    if (index !== -1) {
      users[index].name = document
        .getElementById("editTeacherName")
        .value.trim();
      users[index].email = document
        .getElementById("editTeacherEmail")
        .value.trim();

      // 同步更新课程中的教师名称
      const courses = DB.get("courses");
      courses.forEach((c) => {
        if (c.teacherId === teacherId) {
          c.teacherName = users[index].name;
        }
      });
      DB.set("courses", courses);

      DB.set("users", users);
      const updatedTeacher = users[index]; //定义变量
      DB.log("编辑教师", `工号: ${teacherId}, 姓名: ${updatedTeacher.name}`); //日志
      this.closeEduModal();
      this.showEduToast("✅ 修改成功");
      this.renderEduAdminTeachers();
    }
  },

  deleteTeacher(teacherId) {
    const courses = DB.get("courses").filter((c) => c.teacherId === teacherId);

    if (courses.length > 0) {
      alert(`该教师还有${courses.length}门课程，请先处理这些课程！`);
      return;
    }

    if (!confirm(`确定要删除工号为 ${teacherId} 的教师吗？`)) return;
    // ✅ 先获取教师信息（用于日志）
    const teacher = DB.get("users").find((u) => u.id === teacherId);
    if (!teacher) return;

    let users = DB.get("users");
    users = users.filter((u) => u.id !== teacherId);
    DB.set("users", users);
    DB.log("删除教师", `工号: ${teacherId}, 姓名: ${teacher.name || "未知"}`); //日志
    this.showEduToast("✅ 删除成功");
    this.renderEduAdminTeachers();
  },

  // ==================== 课程管理 ====================
  renderEduAdminCourses() {
    this.updateEduAdminNav("nav-edu-courses");

    const courses = DB.get("courses");
    const enrollments = DB.get("enrollments");

    const html = `
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">课程列表</h3>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="courseSearchInput" placeholder="搜索课程..." 
                            style="padding:8px; border:1px solid #ddd; border-radius:4px; width:200px;"
                            oninput="app.searchEduCourses(this.value)">
                        <button class="btn btn-primary" onclick="app.showAddCourseModal()">➕ 创建课程</button>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:10%">课程号</th>
                            <th style="width:20%">课程名</th>
                            <th style="width:12%">教师</th>
                            <th style="width:8%">学分</th>
                            <th style="width:10%">学期</th>
                            <th style="width:10%">选课人数</th>
                            <th style="width:10%">状态</th>
                            <th style="width:20%">操作</th>
                        </tr>
                    </thead>
                    <tbody id="coursesTableBody">
                        ${this.renderCourseRows(courses, enrollments)}
                    </tbody>
                </table>
            </div>
        `;

    document.getElementById("eduAdminContent").innerHTML = html;
  },

  renderCourseRows(courses, enrollments) {
    if (courses.length === 0) {
      return '<tr><td colspan="8" style="text-align:center; padding:40px; color:#888;">暂无课程数据</td></tr>';
    }

    return courses
      .map((c) => {
        const studentCount = enrollments.filter(
          (e) => e.courseId === c.id
        ).length;
        return `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>${c.teacherName}</td>
                    <td>${c.credit}</td>
                    <td>${c.semester || "2024秋季"}</td>
                    <td>${studentCount}</td>
                    <td><span class="tag ${
                      c.status === "published" ? "tag-success" : "tag-warning"
                    }">${
          c.status === "published" ? "已发布" : "草稿"
        }</span></td>
                    <td>
                        <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                            <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px; white-space:nowrap;" onclick="app.viewCourseStudents('${
                              c.id
                            }')">学生名单</button>
                            <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px; white-space:nowrap;" onclick="app.editCourse('${
                              c.id
                            }')">编辑</button>
                        </div>
                    </td>
                </tr>
            `;
      })
      .join("");
  },

  searchEduCourses(keyword) {
    const allCourses = DB.get("courses");
    const enrollments = DB.get("enrollments");

    const filtered = allCourses.filter(
      (c) =>
        c.id.toLowerCase().includes(keyword.toLowerCase()) ||
        c.name.toLowerCase().includes(keyword.toLowerCase()) ||
        c.teacherName.toLowerCase().includes(keyword.toLowerCase())
    );

    document.getElementById("coursesTableBody").innerHTML =
      this.renderCourseRows(filtered, enrollments);
  },

  viewCourseStudents(courseId) {
    const course = DB.get("courses").find((c) => c.id === courseId);
    const enrollments = DB.get("enrollments").filter(
      (e) => e.courseId === courseId
    );
    const users = DB.get("users");

    const students = enrollments.map((e) => {
      const student = users.find((u) => u.id === e.studentId);
      return {
        ...student,
        grade: e.grade,
      };
    });

    const modalContent = `
            <h4 style="margin-bottom:15px;">${
              course.name
            }（${courseId}）选课学生名单</h4>
            ${
              students.length > 0
                ? `
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
                        ${students
                          .map(
                            (s) => `
                            <tr>
                                <td>${s.id}</td>
                                <td>${s.name}</td>
                                <td>${s.class || "未分配"}</td>
                                <td>${
                                  s.grade !== null ? s.grade : "未录入"
                                }</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
                <div style="margin-top:15px; color:#666; font-size:14px;">
                    选课人数：<strong>${students.length}</strong>人 | 
                    已录成绩：<strong>${
                      students.filter((s) => s.grade !== null).length
                    }</strong>人
                </div>
            `
                : '<div style="text-align:center; padding:40px; color:#888;">该课程暂无学生选课</div>'
            }
        `;

    this.showEduModal("选课学生名单", modalContent);
  },

  // 添加课程
  showAddCourseModal() {
    const teachers = DB.get("users").filter((u) => u.role === "teacher");

    if (teachers.length === 0) {
      alert("暂无教师，请先添加教师后再创建课程");
      return;
    }

    const modalContent = `
            <form onsubmit="app.handleAddCourse(event)">
                <div class="form-group">
                    <label class="form-label">课程号 *</label>
                    <input type="text" id="newCourseId" class="form-input" required placeholder="例如：C001">
                </div>
                <div class="form-group">
                    <label class="form-label">课程名称 *</label>
                    <input type="text" id="newCourseName" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">授课教师 *</label>
                    <select id="newCourseTeacher" class="form-input" required>
                        <option value="">请选择教师</option>
                        ${teachers
                          .map(
                            (t) =>
                              `<option value="${t.id}">${t.name}（${t.id}）</option>`
                          )
                          .join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">学分 *</label>
                    <input type="number" id="newCourseCredit" class="form-input" required min="0" max="10" step="0.5" value="2">
                </div>
                <div class="form-group">
                    <label class="form-label">学期 *</label>
                    <select id="newCourseSemester" class="form-input" required>
                        <option value="2024春季">2024春季</option>
                        <option value="2024秋季" selected>2024秋季</option>
                        <option value="2025春季">2025春季</option>
                        <option value="2025秋季">2025秋季</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">课程简介</label>
                    <textarea id="newCourseDesc" class="form-input" rows="3" placeholder="简要介绍课程内容"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">开课学院</label>
                    <input type="text" id="newCourseDept" class="form-input" placeholder="例如：计算机与软件学院" value="计算机与软件学院">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">创建课程</button>
            </form>
        `;

    this.showEduModal("创建新课程", modalContent);
  },

  handleAddCourse(e) {
    e.preventDefault();

    const courses = DB.get("courses");
    const newId = document.getElementById("newCourseId").value.trim();

    if (courses.find((c) => c.id === newId)) {
      alert("课程号已存在！");
      return;
    }

    const teacherId = document.getElementById("newCourseTeacher").value;
    const teacher = DB.get("users").find((u) => u.id === teacherId);

    const newCourse = {
      id: newId,
      name: document.getElementById("newCourseName").value.trim(),
      teacherId: teacherId,
      teacherName: teacher.name,
      credit: parseFloat(document.getElementById("newCourseCredit").value),
      semester: document.getElementById("newCourseSemester").value,
      desc: document.getElementById("newCourseDesc").value.trim(),
      dept: document.getElementById("newCourseDept").value.trim() || "未知学院",
      status: "published",
      schedule: null,
      classroom: null,
      materials: [],
      assignmentReq: "",
      gradePublished: false,
    };

    courses.push(newCourse);
    DB.set("courses", courses);

    // 记录操作日志
    /*  this.logOperation(
      "创建课程",
      `创建课程《${newCourse.name}》(${newCourse.id})，授课教师：${teacher.name}`
    );*/
    DB.log(
      "创建课程",
      `课程《${newCourse.name}》(${newCourse.id})，教师：${teacher.name}，学分：${newCourse.credit}，学期：${newCourse.semester}`
    ); //日志
    this.closeEduModal();
    this.showEduToast("✅ 课程创建成功");
    this.renderEduAdminCourses();
  },

  // 编辑课程
  editCourse(courseId) {
    const course = DB.get("courses").find((c) => c.id === courseId);
    if (!course) return;

    const teachers = DB.get("users").filter((u) => u.role === "teacher");

    const modalContent = `
            <form onsubmit="app.handleEditCourse(event, '${courseId}')">
                <div class="form-group">
                    <label class="form-label">课程号</label>
                    <input type="text" class="form-input" value="${
                      course.id
                    }" readonly style="background:#f5f5f5;">
                </div>
                <div class="form-group">
                    <label class="form-label">课程名称 *</label>
                    <input type="text" id="editCourseName" class="form-input" value="${
                      course.name
                    }" required>
                </div>
                <div class="form-group">
                    <label class="form-label">授课教师 *</label>
                    <select id="editCourseTeacher" class="form-input" required>
                        ${teachers
                          .map(
                            (t) =>
                              `<option value="${t.id}" ${
                                t.id === course.teacherId ? "selected" : ""
                              }>${t.name}（${t.id}）</option>`
                          )
                          .join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">学分 *</label>
                    <input type="number" id="editCourseCredit" class="form-input" value="${
                      course.credit
                    }" required min="0" max="10" step="0.5">
                </div>
                <div class="form-group">
                    <label class="form-label">学期 *</label>
                    <select id="editCourseSemester" class="form-input" required>
                        <option value="2024春季" ${
                          course.semester === "2024春季" ? "selected" : ""
                        }>2024春季</option>
                        <option value="2024秋季" ${
                          course.semester === "2024秋季" ? "selected" : ""
                        }>2024秋季</option>
                        <option value="2025春季" ${
                          course.semester === "2025春季" ? "selected" : ""
                        }>2025春季</option>
                        <option value="2025秋季" ${
                          course.semester === "2025秋季" ? "selected" : ""
                        }>2025秋季</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">课程简介</label>
                    <textarea id="editCourseDesc" class="form-input" rows="3">${
                      course.desc || ""
                    }</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">开课学院</label>
                    <input type="text" id="editCourseDept" class="form-input" value="${
                      course.dept || ""
                    }">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">保存修改</button>
            </form>
        `;

    this.showEduModal("编辑课程信息", modalContent);
  },

  handleEditCourse(e, courseId) {
    e.preventDefault();

    const courses = DB.get("courses");
    const index = courses.findIndex((c) => c.id === courseId);

    if (index !== -1) {
      const teacherId = document.getElementById("editCourseTeacher").value;
      const teacher = DB.get("users").find((u) => u.id === teacherId);

      courses[index].name = document
        .getElementById("editCourseName")
        .value.trim();
      courses[index].teacherId = teacherId;
      courses[index].teacherName = teacher.name;
      courses[index].credit = parseFloat(
        document.getElementById("editCourseCredit").value
      );
      courses[index].semester =
        document.getElementById("editCourseSemester").value;
      courses[index].desc = document
        .getElementById("editCourseDesc")
        .value.trim();
      courses[index].dept = document
        .getElementById("editCourseDept")
        .value.trim();

      DB.set("courses", courses);
      DB.log("编辑课程", `修改课程《${courses[index].name}》(${courseId})信息`); //日志

      // 记录操作日志
      /*this.logOperation(
        "编辑课程",
        `修改课程《${courses[index].name}》(${courseId})信息`
      );*/

      this.closeEduModal();
      this.showEduToast("✅ 课程信息已更新");
      this.renderEduAdminCourses();
    }
  },

  // ==================== 班级管理 ====================
  renderEduAdminClasses() {
    this.updateEduAdminNav("nav-edu-classes");

    const students = DB.get("users").filter((u) => u.role === "student");

    // 从学生数据中提取班级信息
    const classMap = new Map();
    students.forEach((s) => {
      if (s.class && s.class.trim()) {
        if (!classMap.has(s.class)) {
          classMap.set(s.class, {
            name: s.class,
            major: s.major || "未知专业",
            students: [],
          });
        }
        classMap.get(s.class).students.push(s);
      }
    });

    const classes = Array.from(classMap.values());

    const html = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">班级管理</h3></div>
                ${
                  classes.length > 0
                    ? `
                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px; padding:20px;">
                        ${classes
                          .map(
                            (cls) => `
                            <div style="border:1px solid #e5e5e5; border-radius:8px; padding:20px; background:#fafafa;">
                                <h4 style="margin:0 0 10px 0; font-size:18px;">${cls.name}</h4>
                                <div style="color:#666; font-size:14px; margin-bottom:15px;">
                                    专业：${cls.major}<br>
                                    学生人数：<strong style="color:#0066cc;">${cls.students.length}</strong>人
                                </div>
                                <button class="btn btn-secondary" style="width:100%;" onclick="app.viewClassDetail('${cls.name}')">查看详情</button>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                `
                    : '<div style="text-align:center; padding:60px; color:#888;">暂无班级数据</div>'
                }
            </div>
        `;

    document.getElementById("eduAdminContent").innerHTML = html;
  },

  viewClassDetail(className) {
    const students = DB.get("users").filter(
      (u) => u.role === "student" && u.class === className
    );

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
                    ${students
                      .map(
                        (s) => `
                        <tr>
                            <td>${s.id}</td>
                            <td>${s.name}</td>
                            <td>${s.major || "未知"}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
            <div style="margin-top:15px; color:#666; font-size:14px;">
                班级人数：<strong>${students.length}</strong>人
            </div>
        `;

    this.showEduModal("班级详情", modalContent);
  },

  // ==================== 排课管理 ====================
  renderEduAdminSchedules() {
    this.updateEduAdminNav("nav-edu-schedules");

    const courses = DB.get("courses").filter((c) => c.status === "published");
    const enrollments = DB.get("enrollments");

    const html = `
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="card-title">排课管理（教室与时间安排）</h3>
                    <button class="btn btn-secondary" onclick="app.batchScheduleCourses()">批量排课</button>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:12%">课程号</th>
                            <th style="width:20%">课程名</th>
                            <th style="width:12%">教师</th>
                            <th style="width:14%">上课时间</th>
                            <th style="width:12%">教室</th>
                            <th style="width:10%">选课人数</th>
                            <th style="width:20%">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${courses
                          .map((c) => {
                            const count = enrollments.filter(
                              (e) => e.courseId === c.id
                            ).length;
                            const hasSchedule = c.schedule && c.classroom;
                            return `
                                <tr style="${
                                  !hasSchedule ? "background:#fff3cd;" : ""
                                }">
                                    <td>${c.id}</td>
                                    <td>${c.name}</td>
                                    <td>${c.teacherName}</td>
                                    <td>${
                                      c.schedule ||
                                      '<span style="color:#ff3b30;">未排课</span>'
                                    }</td>
                                    <td>${
                                      c.classroom ||
                                      '<span style="color:#ff3b30;">未分配</span>'
                                    }</td>
                                    <td>${count}人</td>
                                    <td>
                                        <button class="btn btn-primary" style="padding:4px 12px; font-size:12px;" onclick="app.editCourseSchedule('${
                                          c.id
                                        }')">设置排课</button>
                                        ${
                                          hasSchedule
                                            ? `<button class="btn btn-secondary" style="padding:4px 12px; font-size:12px;" onclick="app.clearCourseSchedule('${c.id}')">清除</button>`
                                            : ""
                                        }
                                    </td>
                                </tr>
                            `;
                          })
                          .join("")}
                        ${
                          courses.length === 0
                            ? '<tr><td colspan="7" style="text-align:center; padding:40px; color:#888;">暂无已发布课程</td></tr>'
                            : ""
                        }
                    </tbody>
                </table>
            </div>
            
            <div class="card" style="margin-top:20px;">
                <div class="card-header"><h3 class="card-title">📅 课程表预览</h3></div>
                <div style="overflow-x:auto; padding:20px;">
                    ${this.generateSchedulePreview(courses)}
                </div>
            </div>
        `;

    document.getElementById("eduAdminContent").innerHTML = html;
  },

  // 编辑课程排课
  editCourseSchedule(courseId) {
    const course = DB.get("courses").find((c) => c.id === courseId);
    if (!course) return;

    const weekdays = ["周一", "周二", "周三", "周四", "周五"];
    const periods = ["1-2节", "3-4节", "5-6节", "7-8节", "9-10节"];
    const classrooms = [
      "A101",
      "A102",
      "A201",
      "A202",
      "B101",
      "B102",
      "B201",
      "B202",
      "C101",
      "C102",
    ];

    const currentSchedule = course.schedule
      ? course.schedule.split(" ")
      : ["", ""];
    const currentWeekday = currentSchedule[0] || "";
    const currentPeriod = currentSchedule.slice(1).join(" ") || "";

    const modalContent = `
            <form onsubmit="app.handleSaveCourseSchedule(event, '${courseId}')">
                <div class="form-group">
                    <label class="form-label">课程信息</label>
                    <div style="background:#f5f5f5; padding:12px; border-radius:4px; margin-bottom:15px;">
                        <strong>${course.name}</strong> (${course.id})<br>
                        <span style="color:#666; font-size:14px;">教师：${
                          course.teacherName
                        } | 学分：${course.credit}</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">上课时间 *</label>
                    <div style="display:flex; gap:10px;">
                        <select id="scheduleWeekday" class="form-input" style="flex:1;" required>
                            <option value="">选择星期</option>
                            ${weekdays
                              .map(
                                (w) =>
                                  `<option value="${w}" ${
                                    w === currentWeekday ? "selected" : ""
                                  }>${w}</option>`
                              )
                              .join("")}
                        </select>
                        <select id="schedulePeriod" class="form-input" style="flex:1;" required>
                            <option value="">选择节次</option>
                            ${periods
                              .map(
                                (p) =>
                                  `<option value="${p}" ${
                                    p === currentPeriod ? "selected" : ""
                                  }>${p}</option>`
                              )
                              .join("")}
                        </select>
                    </div>
                    <div style="font-size:12px; color:#666; margin-top:5px;">
                        💡 选择课程的上课时间
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">教室 *</label>
                    <select id="scheduleClassroom" class="form-input" required>
                        <option value="">选择教室</option>
                        ${classrooms
                          .map(
                            (c) =>
                              `<option value="${c}" ${
                                c === course.classroom ? "selected" : ""
                              }>${c}</option>`
                          )
                          .join("")}
                        <option value="custom">自定义...</option>
                    </select>
                </div>
                
                <div class="form-group" id="customClassroomGroup" style="display:none;">
                    <label class="form-label">自定义教室</label>
                    <input type="text" id="customClassroom" class="form-input" placeholder="输入教室名称">
                </div>
                
                <button type="submit" class="btn btn-primary" style="width:100%;">保存排课</button>
            </form>
            
            <script>
                document.getElementById('scheduleClassroom').addEventListener('change', function() {
                    const customGroup = document.getElementById('customClassroomGroup');
                    if (this.value === 'custom') {
                        customGroup.style.display = 'block';
                        document.getElementById('customClassroom').required = true;
                    } else {
                        customGroup.style.display = 'none';
                        document.getElementById('customClassroom').required = false;
                    }
                });
            </script>
        `;

    this.showEduModal("设置课程排课", modalContent);
  },

  // 保存课程排课
  handleSaveCourseSchedule(e, courseId) {
    e.preventDefault();

    const weekday = document.getElementById("scheduleWeekday").value;
    const period = document.getElementById("schedulePeriod").value;
    let classroom = document.getElementById("scheduleClassroom").value;

    if (classroom === "custom") {
      classroom = document.getElementById("customClassroom").value.trim();
      if (!classroom) {
        alert("请输入自定义教室名称");
        return;
      }
    }

    const schedule = `${weekday} ${period}`;

    // 检查时间冲突
    const courses = DB.get("courses");
    const conflict = courses.find(
      (c) =>
        c.id !== courseId &&
        c.schedule === schedule &&
        c.classroom === classroom
    );

    if (conflict) {
      if (
        !confirm(
          `警告：该时间段的教室已被《${conflict.name}》占用。\n\n是否仍要继续安排？`
        )
      ) {
        return;
      }
    }

    // 更新课程排课信息
    const index = courses.findIndex((c) => c.id === courseId);
    if (index !== -1) {
      courses[index].schedule = schedule;
      courses[index].classroom = classroom;
      DB.set("courses", courses);
      DB.log(
        "设置排课",
        `课程《${course.name}》(${courseId})安排至 ${schedule} @ ${classroom}`
      ); //日志
      // 记录操作日志
      /* this.logOperation(
        "设置排课",
        `为课程《${courses[index].name}》安排：${schedule} ${classroom}`
      );*/

      this.closeEduModal();
      this.showEduToast("✅ 排课设置成功");
      this.renderEduAdminSchedules();
    }
  },

  // 清除课程排课
  clearCourseSchedule(courseId) {
    const course = DB.get("courses").find((c) => c.id === courseId);

    if (!confirm(`确定要清除《${course.name}》的排课信息吗？`)) return;

    const courses = DB.get("courses");
    const index = courses.findIndex((c) => c.id === courseId);

    if (index !== -1) {
      courses[index].schedule = null;
      courses[index].classroom = null;
      DB.set("courses", courses);
      DB.log("清除排课", `移除课程《${course.name}》(${courseId})的排课信息`); //日志
      // this.logOperation("清除排课", `清除课程《${course.name}》的排课信息`);

      this.showEduToast("✅ 排课信息已清除");
      this.renderEduAdminSchedules();
    }
  },

  // 批量排课（智能排课）
  batchScheduleCourses() {
    if (
      !confirm(
        "智能批量排课将为所有未排课的课程自动分配时间和教室。\n\n确定要执行吗？"
      )
    )
      return;

    const courses = DB.get("courses").filter(
      (c) => c.status === "published" && !c.schedule
    );

    if (courses.length === 0) {
      alert("所有课程都已排课！");
      return;
    }

    const weekdays = ["周一", "周二", "周三", "周四", "周五"];
    const periods = ["1-2节", "3-4节", "5-6节", "7-8节"];
    const classrooms = ["A101", "A102", "A201", "A202", "B101", "B102"];

    let scheduledCount = 0;
    const allCourses = DB.get("courses");

    // 获取已占用的时间段
    const occupiedSlots = new Set();
    allCourses.forEach((c) => {
      if (c.schedule && c.classroom) {
        occupiedSlots.add(`${c.schedule}|${c.classroom}`);
      }
    });

    // 为每门课程分配时间和教室
    courses.forEach((course) => {
      let assigned = false;

      for (let classroom of classrooms) {
        if (assigned) break;
        for (let weekday of weekdays) {
          if (assigned) break;
          for (let period of periods) {
            const schedule = `${weekday} ${period}`;
            const slot = `${schedule}|${classroom}`;

            if (!occupiedSlots.has(slot)) {
              const index = allCourses.findIndex((c) => c.id === course.id);
              if (index !== -1) {
                allCourses[index].schedule = schedule;
                allCourses[index].classroom = classroom;
                occupiedSlots.add(slot);
                scheduledCount++;
                assigned = true;
                break;
              }
            }
          }
        }
      }
    });

    DB.set("courses", allCourses);
    DB.log("批量排课", `为 ${scheduledCount} 门课程自动分配教室与时间`); //日志
    /*this.logOperation(
      "批量排课",
      `智能批量排课，成功安排${scheduledCount}门课程`
    );*/

    this.showEduToast(`✅ 批量排课完成，成功安排${scheduledCount}门课程`);
    this.renderEduAdminSchedules();
  },

  generateSchedulePreview(courses) {
    const weekdays = ["周一", "周二", "周三", "周四", "周五"];
    const periods = ["1-2节", "3-4节", "5-6节", "7-8节"];

    let html = '<table class="data-table" style="min-width:600px;">';
    html += '<thead><tr><th style="width:100px;">时间</th>';
    weekdays.forEach((day) => {
      html += `<th>${day}</th>`;
    });
    html += "</tr></thead><tbody>";

    periods.forEach((period) => {
      html += `<tr><td><strong>${period}</strong></td>`;
      weekdays.forEach((day) => {
        const course = courses.find((c) => c.schedule === `${day} ${period}`);
        if (course) {
          html += `<td style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:12px;">
                        <div style="font-weight:600; margin-bottom:4px;">${
                          course.name
                        }</div>
                        <div style="font-size:11px; opacity:0.9;">${
                          course.teacherName
                        }</div>
                        <div style="font-size:11px; opacity:0.9;">${
                          course.classroom || "-"
                        }</div>
                    </td>`;
        } else {
          html += '<td style="background:#f9f9f9;"></td>';
        }
      });
      html += "</tr>";
    });

    html += "</tbody></table>";
    return html;
  },

  // ==================== 成绩审核 ====================
  renderEduAdminGrades() {
    this.updateEduAdminNav("nav-edu-grades");

    // 重新获取最新数据（确保获取到最新的发布状态）
    const courses = DB.get("courses");
    const enrollments = DB.get("enrollments");
    const users = DB.get("users");

    // 按课程统计成绩
    const gradeStats = courses.map((c) => {
      const courseEnrollments = enrollments.filter((e) => e.courseId === c.id);
      const gradedEnrollments = courseEnrollments.filter(
        (e) => e.grade !== null
      );

      const grades = gradedEnrollments.map((e) => e.grade);
      const avgGrade =
        grades.length > 0
          ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)
          : "-";
      const excellentCount = grades.filter((g) => g >= 85).length;
      const passCount = grades.filter((g) => g >= 60).length;
      const excellentRate =
        grades.length > 0
          ? ((excellentCount / grades.length) * 100).toFixed(1)
          : "0.0";
      const passRate =
        grades.length > 0
          ? ((passCount / grades.length) * 100).toFixed(1)
          : "0.0";

      // 课程维度异常检测
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
        anomalyReason: isAnomalousExcellent
          ? "优秀率过高"
          : isAnomalousPass
          ? "及格率过低"
          : "",
        gradePublished: !!c.gradePublished, // 确保布尔值
      };
    });

    // 学生维度异常检测
    const studentAnomalies = this.detectStudentGradeAnomalies(
      enrollments,
      users
    );

    const anomalyCount = gradeStats.filter((s) => s.isAnomaly).length;

    const html = `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:20px;">
                <div class="card" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color:white; padding:20px;">
                    <div style="font-size:14px; opacity:0.9; margin-bottom:8px;">异常课程数</div>
                    <div style="font-size:36px; font-weight:bold;">${anomalyCount}</div>
                </div>
                <div class="card" style="background:linear-gradient(135deg, #fa709a 0%, #fee140 100%); color:white; padding:20px;">
                    <div style="font-size:14px; opacity:0.9; margin-bottom:8px;">异常学生数</div>
                    <div style="font-size:36px; font-weight:bold;">${
                      studentAnomalies.length
                    }</div>
                </div>
            </div>
            
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button class="btn btn-primary" onclick="app.showGradeCourseView()">课程维度</button>
                <button class="btn btn-secondary" onclick="app.showGradeStudentView()">学生维度</button>
            </div>
        
            <div id="gradeViewContent">
                ${this.renderGradeCourseView(gradeStats, anomalyCount)}
            </div>
        `;

    document.getElementById("eduAdminContent").innerHTML = html;
  },

  // 课程维度视图
  renderGradeCourseView(gradeStats, anomalyCount) {
    // 重新过滤待发布课程（使用最新的 gradePublished 状态）
    const unpublishedReady = gradeStats.filter(
      (s) =>
        s.gradePublished !== true && // 明确检查不是 true
        s.gradedStudents === s.totalStudents &&
        s.totalStudents > 0
    );

    return `
            ${
              unpublishedReady.length > 0
                ? `
                <div class="card" style="margin-bottom:20px; border:2px solid #0066cc; background:linear-gradient(to right, #e3f2fd, #f8fafc);">
                    <div class="card-header" style="background:#e3f2fd; border-bottom:1px solid #0066cc;">
                        <h3 class="card-title" style="color:#0d47a1;">📢 待发布成绩提醒</h3>
                    </div>
                    <div style="padding:20px;">
                        <p style="margin:0 0 15px 0; color:#333;">
                            有 <strong style="color:#0066cc; font-size:20px;">${
                              unpublishedReady.length
                            }</strong> 门课程的成绩已全部录入完成，可以发布给学生查看：
                        </p>
                        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
                            ${unpublishedReady
                              .map(
                                (s) => `
                                <span style="background:white; padding:8px 12px; border-radius:4px; border:1px solid #ddd;">
                                    ${s.name} (${s.gradedStudents}人)
                                </span>
                            `
                              )
                              .join("")}
                        </div>
                        <button class="btn btn-primary" style="padding:10px 20px; font-size:14px;" onclick="app.batchPublishGrades()">
                            ✅ 批量发布全部成绩
                        </button>
                        <small style="display:block; margin-top:10px; color:#666;">
                            💡 发布后，学生将立即可以在"成绩单"中查看这些课程的成绩
                        </small>
                    </div>
                </div>
            `
                : ""
            }
            
            <div class="card">
                <div class="card-header"><h3 class="card-title">成绩审核与异常监控（课程维度）</h3></div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:10%">课程号</th>
                            <th style="width:18%">课程名</th>
                            <th style="width:10%">教师</th>
                            <th style="width:8%">人数</th>
                            <th style="width:8%">平均分</th>
                            <th style="width:8%">优秀率</th>
                            <th style="width:8%">及格率</th>
                            <th style="width:12%">状态</th>
                            <th style="width:18%">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gradeStats
                          .map((s) => {
                            const rowStyle = s.isAnomaly
                              ? "background:#fff3cd;"
                              : "";
                            const canPublish =
                              !s.gradePublished &&
                              s.gradedStudents === s.totalStudents &&
                              s.totalStudents > 0;
                            return `
                                <tr style="${rowStyle}">
                                    <td>${s.id}</td>
                                    <td>${s.name}</td>
                                    <td>${s.teacherName}</td>
                                    <td>${s.gradedStudents}/${
                              s.totalStudents
                            }</td>
                                    <td><strong>${s.avgGrade}</strong></td>
                                    <td style="${
                                      parseFloat(s.excellentRate) >= 70
                                        ? "color:#ff9800; font-weight:bold;"
                                        : ""
                                    }">${s.excellentRate}%</td>
                                    <td style="${
                                      parseFloat(s.passRate) < 60 &&
                                      s.gradedStudents > 0
                                        ? "color:#ff3b30; font-weight:bold;"
                                        : ""
                                    }">${s.passRate}%</td>
                                    <td>
                                        ${
                                          s.isAnomaly
                                            ? `<span class="tag tag-warning">⚠️ ${s.anomalyReason}</span>`
                                            : '<span class="tag tag-success">正常</span>'
                                        }
                                        ${
                                          s.gradePublished
                                            ? '<br><span class="tag tag-success" style="margin-top:4px;">✓ 已发布</span>'
                                            : canPublish
                                            ? '<br><span class="tag" style="margin-top:4px; background:#fff3e0; color:#e65100; border:1px solid #ffb74d;">⏳ 待发布</span>'
                                            : '<br><span class="tag" style="margin-top:4px; background:#e0e0e0; color:#666;">录入中</span>'
                                        }
                                    </td>
                                    <td>
                                        <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                                            <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px; white-space:nowrap;" onclick="app.viewCourseGradeDetail('${
                                              s.id
                                            }')">查看详情</button>
                                            ${
                                              canPublish
                                                ? `<button class="btn btn-primary" style="padding:4px 10px; font-size:12px; white-space:nowrap; background:#0066cc;" onclick="app.publishCourseGrade('${s.id}')">🚀 发布</button>`
                                                : s.gradePublished
                                                ? `<button class="btn btn-secondary" style="padding:4px 10px; font-size:12px; white-space:nowrap;" onclick="app.unpublishCourseGrade('${s.id}')">撤回</button>`
                                                : ""
                                            }
                                        </div>
                                    </td>
                                </tr>
                            `;
                          })
                          .join("")}
                        ${
                          gradeStats.length === 0
                            ? '<tr><td colspan="9" style="text-align:center; padding:40px; color:#888;">暂无课程数据</td></tr>'
                            : ""
                        }
                    </tbody>
                </table>
            </div>
            
            ${
              anomalyCount > 0
                ? `
                <div class="card" style="margin-top:20px; border:1px solid #ffc107; background:#fffbf0;">
                    <div class="card-header" style="background:#fff3cd;"><h3 class="card-title" style="color:#856404;">⚠️ 异常提示</h3></div>
                    <div style="padding:20px; color:#856404;">
                        <p>检测到 <strong>${anomalyCount}</strong> 门课程存在成绩异常：</p>
                        <ul style="margin:10px 0; padding-left:20px;">
                            <li>优秀率过高（≥70%）可能需要审核评分标准</li>
                            <li>及格率过低（<60%）建议核查教学质量</li>
                        </ul>
                        <p style="margin-top:15px;">💡 <strong>建议：</strong>对异常课程进行重点审核后再发布成绩。</p>
                    </div>
                </div>
            `
                : ""
            }
        `;
  },

  // 学生维度异常检测（降低阈值，便于演示）
  detectStudentGradeAnomalies(enrollments, users) {
    const students = users.filter((u) => u.role === "student");
    const anomalies = [];

    students.forEach((student) => {
      const studentEnrollments = enrollments.filter(
        (e) => e.studentId === student.id && e.grade !== null
      );

      if (studentEnrollments.length < 2) return; // 至少需要2门课程才能比较

      const grades = studentEnrollments
        .map((e) => e.grade)
        .sort((a, b) => a - b);
      const avgGrade = grades.reduce((a, b) => a + b, 0) / grades.length;
      const variance =
        grades.reduce((sum, g) => sum + Math.pow(g - avgGrade, 2), 0) /
        grades.length;
      const stdDev = Math.sqrt(variance);

      const maxGrade = Math.max(...grades);
      const minGrade = Math.min(...grades);
      const gradeRange = maxGrade - minGrade;

      // 调整检测阈值（便于演示）：
      // 1. 标准差 > 15 (原20)
      // 2. 成绩极差 > 20 (原40)
      // 3. 单科与平均分差距 > 15 (原25)
      // 4. 存在不及格但平均分>75 或 存在优秀但平均分<65

      const hasLargeDeviation = stdDev > 15;
      const hasLargeRange = gradeRange > 20;
      const hasExtreme = maxGrade - avgGrade > 15 || avgGrade - minGrade > 15;
      const hasSuspicious =
        (minGrade < 60 && avgGrade > 75) || (maxGrade >= 85 && avgGrade < 65);

      if (hasLargeDeviation || hasLargeRange || hasExtreme || hasSuspicious) {
        let reason = "";
        if (minGrade < 60 && avgGrade > 75) {
          reason = "存在不及格课程但整体成绩良好";
        } else if (maxGrade >= 85 && avgGrade < 65) {
          reason = "存在优秀但整体成绩偏低";
        } else if (gradeRange > 30) {
          reason = "成绩波动异常大";
        } else if (maxGrade - avgGrade > 18) {
          reason = "存在异常高分课程";
        } else if (avgGrade - minGrade > 18) {
          reason = "存在异常低分课程";
        } else if (stdDev > 18) {
          reason = "成绩分布不稳定";
        } else {
          reason = "成绩分布存在异常";
        }

        anomalies.push({
          student,
          avgGrade: avgGrade.toFixed(1),
          maxGrade,
          minGrade,
          courseCount: studentEnrollments.length,
          stdDev: stdDev.toFixed(1),
          gradeRange: gradeRange.toFixed(1),
          reason,
        });
      }
    });

    return anomalies;
  },

  // 切换到课程维度
  showGradeCourseView() {
    const btn1 =
      document.querySelector("#gradeViewContent").previousElementSibling
        .children[0];
    const btn2 =
      document.querySelector("#gradeViewContent").previousElementSibling
        .children[1];
    btn1.className = "btn btn-primary";
    btn2.className = "btn btn-secondary";

    // 重新获取最新数据
    const courses = DB.get("courses");
    const enrollments = DB.get("enrollments");

    const gradeStats = courses.map((c) => {
      const courseEnrollments = enrollments.filter((e) => e.courseId === c.id);
      const gradedEnrollments = courseEnrollments.filter(
        (e) => e.grade !== null
      );

      const grades = gradedEnrollments.map((e) => e.grade);
      const avgGrade =
        grades.length > 0
          ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)
          : "-";
      const excellentCount = grades.filter((g) => g >= 85).length;
      const passCount = grades.filter((g) => g >= 60).length;
      const excellentRate =
        grades.length > 0
          ? ((excellentCount / grades.length) * 100).toFixed(1)
          : "0.0";
      const passRate =
        grades.length > 0
          ? ((passCount / grades.length) * 100).toFixed(1)
          : "0.0";

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
        anomalyReason: isAnomalousExcellent
          ? "优秀率过高"
          : isAnomalousPass
          ? "及格率过低"
          : "",
        gradePublished: c.gradePublished || false, // 确保使用最新的发布状态
      };
    });

    const anomalyCount = gradeStats.filter((s) => s.isAnomaly).length;

    document.getElementById("gradeViewContent").innerHTML =
      this.renderGradeCourseView(gradeStats, anomalyCount);
  },

  // 切换到学生维度
  showGradeStudentView() {
    const btn1 =
      document.querySelector("#gradeViewContent").previousElementSibling
        .children[0];
    const btn2 =
      document.querySelector("#gradeViewContent").previousElementSibling
        .children[1];
    btn1.className = "btn btn-secondary";
    btn2.className = "btn btn-primary";

    const enrollments = DB.get("enrollments");
    const users = DB.get("users");
    const studentAnomalies = this.detectStudentGradeAnomalies(
      enrollments,
      users
    );

    const html = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">成绩异常监控（学生维度）</h3></div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:10%">学号</th>
                            <th style="width:10%">姓名</th>
                            <th style="width:12%">班级</th>
                            <th style="width:8%">课程数</th>
                            <th style="width:8%">平均分</th>
                            <th style="width:8%">最高分</th>
                            <th style="width:8%">最低分</th>
                            <th style="width:8%">极差</th>
                            <th style="width:8%">标准差</th>
                            <th style="width:20%">异常原因</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentAnomalies
                          .map(
                            (a) => `
                            <tr style="background:#fff3cd;">
                                <td>${a.student.id}</td>
                                <td>${a.student.name}</td>
                                <td>${a.student.class || "未分配"}</td>
                                <td>${a.courseCount}</td>
                                <td><strong>${a.avgGrade}</strong></td>
                                <td style="color:#34c759; font-weight:bold;">${
                                  a.maxGrade
                                }</td>
                                <td style="color:#ff3b30; font-weight:bold;">${
                                  a.minGrade
                                }</td>
                                <td style="color:#ff9800; font-weight:bold;">${
                                  a.gradeRange
                                }</td>
                                <td>${a.stdDev}</td>
                                <td><span class="tag tag-warning">⚠️ ${
                                  a.reason
                                }</span></td>
                            </tr>
                        `
                          )
                          .join("")}
                        ${
                          studentAnomalies.length === 0
                            ? '<tr><td colspan="10" style="text-align:center; padding:40px; color:#888;">未检测到学生成绩异常<br><small style="color:#999;">（已调整检测阈值，当前数据分布较为正常）</small></td></tr>'
                            : ""
                        }
                    </tbody>
                </table>
            </div>
            
            ${
              studentAnomalies.length > 0
                ? `
                <div class="card" style="margin-top:20px; border:1px solid #ffc107; background:#fffbf0;">
                    <div class="card-header" style="background:#fff3cd;"><h3 class="card-title" style="color:#856404;">⚠️ 学生维度异常说明</h3></div>
                    <div style="padding:20px; color:#856404;">
                        <p>检测到 <strong>${studentAnomalies.length}</strong> 名学生的成绩存在异常：</p>
                        <ul style="margin:10px 0; padding-left:20px;">
                            <li><strong>成绩波动大：</strong>成绩极差（最高-最低）超过20分</li>
                            <li><strong>存在异常高分/低分：</strong>单科成绩与平均分相差超过15分</li>
                            <li><strong>标准差过大（>15）：</strong>成绩分布不稳定，波动明显</li>
                            <li><strong>矛盾表现：</strong>存在不及格但整体良好，或存在优秀但整体偏低</li>
                        </ul>
                        <p style="margin-top:15px;">💡 <strong>建议：</strong>关注这些学生的学习状态，可能存在偏科、考试状态不稳定或其他需要关注的情况。</p>
                    </div>
                </div>
            `
                : ""
            }
        `;

    document.getElementById("gradeViewContent").innerHTML = html;
  },

  // 查看课程成绩详情
  viewCourseGradeDetail(courseId) {
    const course = DB.get("courses").find((c) => c.id === courseId);
    const enrollments = DB.get("enrollments").filter(
      (e) => e.courseId === courseId
    );
    const users = DB.get("users");

    const students = enrollments
      .map((e) => {
        const student = users.find((u) => u.id === e.studentId);
        return { ...student, grade: e.grade };
      })
      .sort((a, b) => (b.grade || 0) - (a.grade || 0));

    const modalContent = `
            <h4 style="margin-bottom:15px;">${
              course.name
            }（${courseId}）成绩详情</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>学号</th>
                        <th>姓名</th>
                        <th>班级</th>
                        <th>成绩</th>
                        <th>等级</th>
                    </tr>
                </thead>
                <tbody>
                    ${students
                      .map((s, idx) => {
                        let gradeLevel = "-";
                        if (s.grade !== null) {
                          if (s.grade >= 85) gradeLevel = "优秀";
                          else if (s.grade >= 75) gradeLevel = "良好";
                          else if (s.grade >= 60) gradeLevel = "及格";
                          else gradeLevel = "不及格";
                        }
                        return `
                            <tr>
                                <td>${s.grade !== null ? idx + 1 : "-"}</td>
                                <td>${s.id}</td>
                                <td>${s.name}</td>
                                <td>${s.class || "未分配"}</td>
                                <td><strong>${
                                  s.grade !== null ? s.grade : "未录入"
                                }</strong></td>
                                <td>${gradeLevel}</td>
                            </tr>
                        `;
                      })
                      .join("")}
                </tbody>
            </table>
        `;

    this.showEduModal("课程成绩详情", modalContent);
  },

  // 发布课程成绩
  publishCourseGrade(courseId) {
    const courses = DB.get("courses");
    const course = courses.find((c) => c.id === courseId);

    if (!course) {
      alert("课程不存在");
      return;
    }

    if (
      !confirm(
        `确定要发布《${course.name}》的成绩吗？\n\n✅ 发布后，学生将立即可在"成绩单"中查看该课程成绩。`
      )
    )
      return;

    const index = courses.findIndex((c) => c.id === courseId);

    if (index !== -1) {
      // 直接修改数组中的对象
      courses[index].gradePublished = true;
      courses[index].gradePublishedTime = new Date().toISOString();
      courses[index].gradePublishedBy = this.state.currentUser
        ? this.state.currentUser.id
        : "admin";

      // 保存到数据库
      DB.set("courses", courses);
      DB.log("发布成绩", `课程《${course.name}》(${courseId})成绩已发布`); //日志
      // 记录操作日志
      /* this.logOperation(
        "发布成绩",
        `发布课程《${course.name}》(${courseId})的成绩`
      );*/

      this.showEduToast("✅ 成绩已发布，学生现在可以查看");

      // 重新渲染页面
      this.renderEduAdminGrades();
    }
  },

  // 撤回发布成绩
  unpublishCourseGrade(courseId) {
    const course = DB.get("courses").find((c) => c.id === courseId);

    if (
      !confirm(
        `确定要撤回《${course.name}》的成绩发布吗？\n\n⚠️ 撤回后，学生将无法查看该课程成绩。`
      )
    )
      return;

    const courses = DB.get("courses");
    const index = courses.findIndex((c) => c.id === courseId);

    if (index !== -1) {
      courses[index].gradePublished = false;
      courses[index].gradePublishedTime = null;
      DB.set("courses", courses);
      DB.log("撤回成绩发布", `课程《${course.name}》(${courseId})成绩已撤回`); //日志
      // 记录操作日志
      /*this.logOperation(
        "撤回成绩发布",
        `撤回课程《${course.name}》(${courseId})的成绩发布`
      );*/

      this.showEduToast("✅ 已撤回成绩发布");
      this.renderEduAdminGrades();
    }
  },

  // 批量发布成绩
  batchPublishGrades() {
    const courses = DB.get("courses");
    const enrollments = DB.get("enrollments");

    // 找出所有已录入完成但未发布的课程
    const readyToPublish = courses.filter((c) => {
      const courseEnrollments = enrollments.filter((e) => e.courseId === c.id);
      const gradedEnrollments = courseEnrollments.filter(
        (e) => e.grade !== null
      );
      return (
        c.gradePublished !== true && // 明确检查未发布
        courseEnrollments.length > 0 &&
        gradedEnrollments.length === courseEnrollments.length
      );
    });

    if (readyToPublish.length === 0) {
      alert("没有可发布的成绩！\n\n请确保课程已录入完所有学生的成绩。");
      return;
    }

    const courseList = readyToPublish
      .map((c) => `  • ${c.name} (${c.id})`)
      .join("\n");

    if (
      !confirm(
        `确定要批量发布以下 ${readyToPublish.length} 门课程的成绩吗？\n\n${courseList}\n\n✅ 发布后，学生将立即可以查看这些课程的成绩。`
      )
    )
      return;

    let publishedCount = 0;
    const timestamp = new Date().toISOString();
    const userId = this.state.currentUser ? this.state.currentUser.id : "admin";

    readyToPublish.forEach((course) => {
      const index = courses.findIndex((c) => c.id === course.id);
      if (index !== -1) {
        courses[index].gradePublished = true;
        courses[index].gradePublishedTime = timestamp;
        courses[index].gradePublishedBy = userId;
        publishedCount++;
      }
    });

    // 保存到数据库
    DB.set("courses", courses);
    const courseNames = readyToPublish.map((c) => c.name).join("、");
    DB.log("批量发布成绩", `成功发布 ${publishedCount} 门课程：${courseNames}`);
    // 记录操作日志
    /*this.logOperation(
      "批量发布成绩",
      `批量发布${publishedCount}门课程的成绩：${readyToPublish
        .map((c) => c.name)
        .join("、")}`
    );*/

    this.showEduToast(`✅ 成功发布${publishedCount}门课程的成绩`);

    // 重新渲染页面
    this.renderEduAdminGrades();
  },

  // 操作日志记录
  logOperation(action, detail) {
    let logs = DB.get("operationLogs") || [];
    logs.push({
      id: Date.now(),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action,
      detail,
      timestamp: new Date().toISOString(),
    });
    DB.set("operationLogs", logs);
  },

  // ==================== 通用工具方法 ====================
  showEduModal(title, contentHTML) {
    const oldModal = document.getElementById("edu-modal");
    if (oldModal) oldModal.remove();

    const modalOverlay = document.createElement("div");
    modalOverlay.id = "edu-modal";
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

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) this.closeEduModal();
    });
  },

  closeEduModal() {
    const modal = document.getElementById("edu-modal");
    if (modal) modal.remove();
  },

  // ==================== 系统联动性说明 ====================
  /**
   * 📌 教学管理端数据联动机制说明
   *
   * 1. 学生管理 ✅
   *    - 添加/编辑学生 → 直接更新 DB.users
   *    - 学生信息同步：所有模块实时读取 users 数据
   *    - 专业字段：必填项，显示"待完善"提示需要编辑
   *
   * 2. 教师管理 ✅
   *    - 添加/编辑教师 → 更新 DB.users 和相关课程的 teacherName
   *    - 教师信息同步：课程表、成绩表等自动同步
   *
   * 3. 课程管理 ✅
   *    - 创建课程 → 存入 DB.courses，教师端立即可见
   *    - 编辑课程 → 更新课程信息，所有模块同步
   *    - 课程包含学期字段，用于学生端成绩分学期展示
   *
   * 4. 成绩发布机制 ⭐⭐⭐ 重要
   *    - 教师录入成绩 → 存入 DB.enrollments[].grade
   *    - 管理员审核发布 → 设置 DB.courses[].gradePublished = true
   *    - 批量发布功能 → 一键发布所有已录入完成的课程成绩
   *    - 撤回发布功能 → 可以撤回已发布的成绩
   *    - 学生查看成绩 → 学生端必须过滤 gradePublished = true 的课程
   *    - 发布后立即生效（无需刷新）
   *
   *    💡 学生端代码实现示例：
   *    ```javascript
   *    // 在 renderStudentGrades() 函数中
   *    const enrollments = DB.get('enrollments')
   *        .filter(e => e.studentId === this.currentUser.id && e.grade !== null);
   *    const courses = DB.get('courses');
   *
   *    const allGradeData = enrollments.map(e => {
   *        const c = courses.find(course => course.id === e.courseId);
   *        // ⚠️ 关键：只显示已发布的成绩
   *        if (!c || !c.gradePublished) return null;
   *        return { ...c, grade: e.grade, details: e.details };
   *    }).filter(d => d !== null);
   *    ```
   *
   * 5. 成绩异常检测 ✅
   *    - 课程维度：优秀率≥70% 或 及格率<60%
   *    - 学生维度：成绩极差>20分 或 标准差>15 或 矛盾表现
   *    - 检测阈值已调整便于演示
   *
   * 6. 成绩未录入说明 ℹ️
   *    - 显示"未录入"是正常状态，等待教师端录入
   *    - 录入流程：教师端 → 成绩录入 → 保存
   *    - 录入后实时同步到 enrollments 数据
   *
   * 7. 排课管理 ✅
   *    - 设置排课 → 更新 courses[].schedule 和 classroom
   *    - 学生/教师课程表实时同步显示
   *
   * 8. 操作日志 📝
   *    - 所有关键操作自动记录到 DB.operationLogs
   *    - 供系统管理员审计使用
   */
  showSystemSyncInfo() {
    const info = `
            <div style="line-height:1.8;">
                <h4 style="color:#0066cc; border-bottom:2px solid #0066cc; padding-bottom:10px;">📊 系统数据联动机制</h4>
                
                <h5 style="margin-top:20px; color:#34c759;">✅ 已实现的联动功能</h5>
                <ul style="margin-left:20px;">
                    <li><strong>学生管理：</strong>添加/编辑学生后，所有模块实时同步（选课、成绩、课程表等）</li>
                    <li><strong>教师管理：</strong>编辑教师信息后，关联课程的教师名自动更新</li>
                    <li><strong>课程管理：</strong>创建课程后，教师端立即可见，学生可选课</li>
                    <li><strong>成绩发布：</strong>审核发布后，学生立即可在成绩单中查看（已发布的课程）</li>
                    <li><strong>排课管理：</strong>设置时间教室后，课程表自动更新</li>
                </ul>
                
                <h5 style="margin-top:20px; color:#ff9800;">⚠️ 重要提示</h5>
                <ul style="margin-left:20px;">
                    <li><strong>专业字段：</strong>部分学生显示<span style="color:#ff9800;">【待完善】</span>，需要点击"编辑"补充专业信息</li>
                    <li><strong>成绩未录入：</strong>需要教师先在"教师端 → 成绩录入"中填写成绩</li>
                    <li><strong>成绩发布机制：</strong>只有在"成绩审核"中点击<span style="color:#0066cc; font-weight:bold;">"发布成绩"</span>或<span style="color:#0066cc; font-weight:bold;">"批量发布全部成绩"</span>后，学生才能在成绩单中看到</li>
                    <li><strong>数据同步：</strong>所有数据存储在localStorage中，刷新页面即可看到最新数据</li>
                </ul>
                
                <h5 style="margin-top:20px; color:#0066cc;">🎯 成绩发布详细说明</h5>
                <div style="background:#e3f2fd; padding:15px; border-radius:4px; border-left:4px solid #0066cc;">
                    <p style="margin:0 0 10px 0;"><strong>发布流程：</strong></p>
                    <ol style="margin:0 0 10px 20px; padding:0;">
                        <li>教师在"教师端"录入成绩（平时分、期中、期末）→ 保存</li>
                        <li>管理员在"成绩审核"查看成绩统计和异常检测</li>
                        <li>点击<strong>"发布成绩"</strong>按钮 → 设置 <code>gradePublished = true</code></li>
                        <li>学生端自动过滤并显示已发布的成绩</li>
                    </ol>
                    <p style="margin:0; color:#0d47a1;"><strong>💡 提示：</strong>可使用"批量发布全部成绩"一键发布所有已录入完成的课程。</p>
                </div>
                
                <h5 style="margin-top:20px; color:#666;">🔄 典型操作流程</h5>
                <div style="background:#f5f5f5; padding:15px; border-radius:4px; margin-top:10px;">
                    <p style="margin:0 0 10px 0; font-weight:bold;">1️⃣ 学期开课流程</p>
                    <p style="margin:0 0 15px 20px; color:#555;">
                        创建课程（设置学期、学分）→ 分配教师 → 设置排课（时间、教室）→ 学生选课
                    </p>
                    
                    <p style="margin:0 0 10px 0; font-weight:bold;">2️⃣ 成绩管理流程</p>
                    <p style="margin:0 0 15px 20px; color:#555;">
                        教师录入成绩 → 管理员审核（检查异常）→ <span style="background:#fff3e0; padding:2px 6px; border-radius:3px;">发布成绩</span> → 学生查看
                    </p>
                    
                    <p style="margin:0 0 10px 0; font-weight:bold;">3️⃣ 学生管理流程</p>
                    <p style="margin:0 0 0 20px; color:#555;">
                        批量导入学生 → 编辑完善信息（专业、班级）→ 查看课程表
                    </p>
                </div>
                
                <h5 style="margin-top:20px; color:#e65100;">🎪 演示建议</h5>
                <div style="background:#fff3e0; padding:15px; border-radius:4px; border-left:4px solid #ff9800;">
                    <ul style="margin:0; padding-left:20px;">
                        <li>学生异常检测已调整阈值，当成绩极差>20分或标准差>15时会触发异常</li>
                        <li>未发布的成绩会在界面上显示<span style="background:#fff3e0; padding:2px 6px; border-radius:3px; color:#e65100;">⏳ 待发布</span>标签</li>
                        <li>发布成绩后，学生端立即可见（已设置 gradePublished = true）</li>
                        <li>可以使用"撤回"功能取消发布</li>
                    </ul>
                </div>
            </div>
        `;

    this.showEduModal("📖 系统联动性说明", info);
  },
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

if (!document.getElementById("edu-admin-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "edu-admin-styles";
  styleSheet.innerText = eduAdminStyles;
  document.head.appendChild(styleSheet);
}

/**
 * ==================== 教学管理端功能总结 ====================
 *
 * ✅ 已实现的核心功能：
 *
 * 1. 教学基础数据管理
 *    ✓ 学生管理（增删改查、批量导入、课程表查看）
 *    ✓ 教师管理（增删改查、授课列表查看）
 *    ✓ 课程管理（创建、编辑、学生名单）
 *    ✓ 班级管理（班级列表、学生分布）
 *
 * 2. 学期开课计划
 *    ✓ 课程创建（分配教师、设置学期）
 *    ✓ 教室安排管理（设置时间、教室、冲突检测）
 *    ✓ 课程表生成（可视化预览）
 *    ✓ 智能批量排课
 *
 * 3. 成绩审核与发布
 *    ✓ 课程维度异常监控（优秀率、及格率）
 *    ✓ 学生维度异常监控（成绩波动、异常分数）
 *    ✓ 成绩发布功能（设置已发布状态）
 *    ✓ 成绩详情查看
 *
 * 4. 系统联动
 *    ✓ 跨模块数据同步（实时更新）
 *    ✓ 操作日志记录（审计追踪）
 *    ✓ 成绩发布状态管理
 *
 * 📝 使用说明：
 * - 所有数据修改后自动保存到 localStorage
 * - 刷新页面查看最新数据
 * - 成绩必须先由教师录入，再由管理员发布
 * - 学生的专业信息需要在"学生管理"中完善
 */
