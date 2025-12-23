const Security = {
  legacyHash(password, salt) {
    return btoa(encodeURIComponent(salt + password));
  },
  constantTimeEqual(a, b) {
    const len = Math.max(a.length, b.length);
    let diff = a.length ^ b.length;
    for (let i = 0; i < len; i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return diff === 0;
  },
  bytesToBase64(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  },
  base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  },
  getCrypto() {
    const c = globalThis.crypto;
    if (!c || !c.subtle || !c.getRandomValues) {
      throw new Error("当前环境不支持 WebCrypto");
    }
    return c;
  },
  async pbkdf2Hash(
    password,
    saltBase64,
    iterations = 100000,
    lengthBytes = 32
  ) {
    const c = this.getCrypto();
    const encoder = new TextEncoder();
    const key = await c.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const bits = await c.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: this.base64ToBytes(saltBase64),
        iterations,
        hash: "SHA-256",
      },
      key,
      lengthBytes * 8
    );
    return this.bytesToBase64(new Uint8Array(bits));
  },
  async createPasswordRecord(password, iterations = 100000) {
    const c = this.getCrypto();
    const saltBytes = new Uint8Array(16);
    c.getRandomValues(saltBytes);
    const salt = this.bytesToBase64(saltBytes);
    const hash = await this.pbkdf2Hash(password, salt, iterations);
    return { algo: "pbkdf2-sha256", iterations, salt, hash };
  },
  async verifyPassword(password, user) {
    if (
      user &&
      user.passwordAlgo === "pbkdf2-sha256" &&
      user.salt &&
      user.passwordHash
    ) {
      const iterations = user.passwordIterations || 100000;
      const hash = await this.pbkdf2Hash(password, user.salt, iterations);
      return this.constantTimeEqual(hash, user.passwordHash);
    }
    const legacySalt = (user && user.salt) || (user && user.id) || "";
    return this.constantTimeEqual(
      this.legacyHash(password, legacySalt),
      (user && user.passwordHash) || ""
    );
  },
};

const pad3 = (n) => String(n).padStart(3, "0");

const TEACHER_POOL = [
  { teacherId: "T001", teacherName: "王老师" },
  { teacherId: "T002", teacherName: "赵老师" },
  { teacherId: "T003", teacherName: "李老师" },
  { teacherId: "T004", teacherName: "周老师" },
  { teacherId: "T005", teacherName: "陈老师" },
  { teacherId: "T006", teacherName: "刘老师" },
  { teacherId: "T007", teacherName: "杨老师" },
  { teacherId: "T008", teacherName: "黄老师" },
  { teacherId: "T009", teacherName: "吴老师" },
  { teacherId: "T010", teacherName: "徐老师" },
  { teacherId: "T011", teacherName: "孙老师" },
  { teacherId: "T012", teacherName: "胡老师" },
  { teacherId: "T013", teacherName: "朱老师" },
  { teacherId: "T014", teacherName: "高老师" },
  { teacherId: "T015", teacherName: "林老师" },
  { teacherId: "T016", teacherName: "何老师" },
  { teacherId: "T017", teacherName: "郭老师" },
  { teacherId: "T018", teacherName: "马老师" },
  { teacherId: "T019", teacherName: "罗老师" },
  { teacherId: "T020", teacherName: "梁老师" },
];

const createLegacyUser = (user) => {
  const id = user.id;
  return {
    ...user,
    passwordHash: user.passwordHash || Security.legacyHash("password", id),
    salt: user.salt || id,
    loginAttempts: user.loginAttempts || 0,
    lockUntil: user.lockUntil || 0,
  };
};

const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const hashString = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const generateExtraUsers = (studentCount = 80, teacherPool = TEACHER_POOL) => {
  const users = [];

  for (const t of teacherPool) {
    users.push(
      createLegacyUser({
        id: t.teacherId,
        name: t.teacherName,
        role: "teacher",
        email: `${t.teacherId.toLowerCase()}@szu.edu.cn`,
      })
    );
  }

  const surnames = [
    "张",
    "李",
    "王",
    "赵",
    "刘",
    "陈",
    "杨",
    "黄",
    "周",
    "吴",
    "徐",
    "孙",
    "胡",
    "朱",
    "高",
    "林",
    "何",
    "郭",
    "马",
    "罗",
    "梁",
    "宋",
    "郑",
    "谢",
    "唐",
  ];
  const given = [
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
    "十",
    "子涵",
    "雨桐",
    "浩然",
    "梓轩",
    "欣怡",
    "语嫣",
    "明轩",
    "嘉怡",
    "思远",
    "若曦",
  ];

  for (let i = 1; i <= studentCount; i++) {
    const id = `S${pad3(i)}`;
    const name =
      i <= 2
        ? i === 1
          ? "张三"
          : "李四"
        : `${surnames[(i - 1) % surnames.length]}${
            given[(i - 1) % given.length]
          }`;
    const cls = `2021级计算机${((i - 1) % 4) + 1}班`;
    users.push(
      createLegacyUser({
        id,
        name,
        role: "student",
        email: `s${pad3(i)}@szu.edu.cn`,
        class: cls,
      })
    );
  }

  users.push(
    createLegacyUser({
      id: "TA001",
      name: "教学秘书",
      role: "edu_admin",
      email: "sec@szu.edu.cn",
    })
  );
  users.push(
    createLegacyUser({
      id: "SA001",
      name: "系统管理员",
      role: "sys_admin",
      email: "admin@szu.edu.cn",
    })
  );

  return users;
};

const generateMockEnrollments = (courses, studentIds) => {
  const enrollments = [];
  for (const c of courses) {
    const rand = mulberry32(hashString(String(c.id || "")));
    const want = Math.max(3, Math.min(10, 3 + Math.floor(rand() * 8)));
    const picked = new Set();
    let guard = 0;
    while (picked.size < want && guard < want * 50) {
      guard++;
      const sid = studentIds[Math.floor(rand() * studentIds.length)];
      if (!sid) continue;
      picked.add(sid);
    }

    for (const sid of picked) {
      const graded = rand() < 0.45;
      const hw = graded ? Math.round(60 + rand() * 40) : null;
      const mid = graded ? Math.round(60 + rand() * 40) : null;
      const fin = graded ? Math.round(60 + rand() * 40) : null;
      const total = graded
        ? Math.round(hw * 0.3 + mid * 0.3 + fin * 0.4)
        : null;
      enrollments.push({
        studentId: sid,
        courseId: c.id,
        grade: total,
        details: { homework: hw, midterm: mid, final: fin },
      });
    }
  }
  return enrollments;
};

const generateMockCourses = (count) => {
  const depts = [
    "计算机与软件学院",
    "数学学院",
    "电子与信息工程学院",
    "经济学院",
    "管理学院",
    "外国语学院",
    "物理与光电工程学院",
    "化学与环境工程学院",
    "法学院",
    "艺术与设计学院",
    "生命与海洋科学学院",
    "马克思主义学院",
  ];

  const presetNames = [
    "Web前端开发",
    "数据结构",
    "高等数学",
    "数据库原理",
    "操作系统",
    "计算机网络",
    "软件工程",
    "算法设计与分析",
    "人工智能导论",
    "机器学习基础",
    "深度学习入门",
    "信息安全基础",
    "Java程序设计",
    "Python程序设计",
    "C语言程序设计",
    "离散数学",
    "概率论与数理统计",
    "线性代数",
    "数字电路",
    "信号与系统",
    "经济学原理",
    "管理学基础",
    "大学英语",
    "学术写作",
    "法学概论",
    "设计思维",
    "数据可视化",
    "人机交互",
    "项目管理",
    "云计算基础",
  ];

  const baseSubjects = [
    "数据库系统",
    "计算机组成原理",
    "编译原理",
    "软件测试",
    "需求工程",
    "敏捷开发",
    "移动应用开发",
    "嵌入式系统",
    "物联网技术",
    "区块链技术",
    "大数据技术",
    "数据挖掘",
    "自然语言处理",
    "计算机视觉",
    "图像处理",
    "计算机图形学",
    "人机交互设计",
    "用户体验设计",
    "交互原型设计",
    "产品设计",
    "信息安全",
    "密码学",
    "网络安全",
    "Web安全",
    "云计算",
    "云原生架构",
    "微服务架构",
    "分布式系统",
    "并行计算",
    "高性能计算",
    "概率统计",
    "线性代数",
    "离散数学",
    "数值分析",
    "数学建模",
    "统计学",
    "运筹学",
    "大学物理",
    "电磁学",
    "光学",
    "热学与统计物理",
    "量子力学",
    "无机化学",
    "有机化学",
    "分析化学",
    "物理化学",
    "环境科学",
    "海洋生态学",
    "生命科学",
    "生物化学",
    "材料科学",
    "工程力学",
    "微观经济学",
    "宏观经济学",
    "金融学",
    "会计学",
    "市场营销",
    "组织行为学",
    "供应链管理",
    "国际贸易",
    "民法学",
    "刑法学",
    "行政法学",
    "知识产权法",
    "国际法",
    "社会学",
    "心理学",
    "教育学",
    "跨文化交际",
    "英语口语",
    "学术英语",
    "科技写作",
    "创新创业",
    "职业发展",
    "艺术鉴赏",
    "电影赏析",
    "摄影基础",
    "平面设计",
    "插画设计",
    "数字媒体艺术",
    "体育与健康",
  ];

  const suffixes = [
    "导论",
    "基础",
    "原理",
    "方法",
    "实践",
    "实验",
    "课程设计",
    "案例分析",
    "专题",
    "项目实战",
    "选讲",
    "研讨",
  ];

  const descTemplates = [
    "系统讲解核心概念与常见方法，配合案例与练习巩固。",
    "强调理论与实践结合，包含课堂小测与项目作业。",
    "围绕关键知识点展开，适合零基础到进阶学习。",
    "通过真实场景问题驱动学习，培养分析与解决能力。",
    "涵盖基础、进阶与应用，帮助构建完整知识体系。",
  ];

  const reqTemplates = [
    "无特殊要求，面向全校本科生开放。",
    "建议先修计算机基础或相关课程。",
    "仅限本专业学生选修。",
    "需具备一定的编程基础。",
    "建议大二及以上年级学生选修。",
  ];

  const weekdays = ["周一", "周二", "周三", "周四", "周五"];
  const sessions = ["1-2节", "3-4节", "5-6节", "7-8节", "9-10节"];
  const buildings = ["N", "S", "H", "B", "C", "D"];

  // --- 新增：学期池 ---
  const semesters = ["2024秋季", "2024春季", "2023秋季", "2023春季"];

  const courseNames = (() => {
    const candidates = [];
    const used = new Set();
    const add = (name) => {
      if (!name) return;
      if (used.has(name)) return;
      used.add(name);
      candidates.push(name);
    };

    for (const n of presetNames) add(n);
    for (const subject of baseSubjects) {
      add(subject);
      for (const suffix of suffixes) {
        if (subject.includes(suffix)) continue;
        add(`${subject}${suffix}`);
      }
    }

    return candidates;
  })();

  const courses = [];
  for (let i = 1; i <= count; i++) {
    const teacher = TEACHER_POOL[(i - 1) % TEACHER_POOL.length];

    const baseName = courseNames[i - 1] || `通识选修课${pad3(i)}`;
    const dept = depts[(i - 1) % depts.length];
    const desc = `${baseName}：${
      descTemplates[(i - 1) % descTemplates.length]
    }`;
    const requirements = reqTemplates[(i - 1) % reqTemplates.length];
    const schedule = `${weekdays[(i - 1) % weekdays.length]} ${
      sessions[(i - 1) % sessions.length]
    }`;
    const classroom = `${buildings[(i - 1) % buildings.length]}${String(
      101 + ((i - 1) % 40)
    ).padStart(3, "0")}`;

    // --- 新增：分配学期 ---
    const semester = semesters[(i - 1) % semesters.length];

    courses.push({
      id: `C${pad3(i)}`,
      name: baseName,
      credit: 2 + ((i - 1) % 4),
      teacherId: teacher.teacherId,
      teacherName: teacher.teacherName,
      dept,
      desc,
      requirements,
      status: "published",
      schedule,
      classroom,
      semester, // 注入学期字段
    });
  }

  // 更新固定的课程数据，加入学期
  courses[0] = {
    id: "C001",
    name: "Web前端开发",
    credit: 3,
    teacherId: "T001",
    teacherName: "王老师",
    dept: "计算机与软件学院",
    desc: "本课程介绍HTML5, CSS3, JS基础。",
    status: "published",
    schedule: "周一 3-4节",
    classroom: "N201",
    semester: "2024秋季",
  };
  courses[1] = {
    id: "C002",
    name: "数据结构",
    credit: 4,
    teacherId: "T002",
    teacherName: "赵老师",
    dept: "计算机与软件学院",
    desc: "计算机专业核心课程。",
    status: "published",
    schedule: "周二 1-2节",
    classroom: "S304",
    semester: "2024春季",
  };
  courses[2] = {
    id: "C003",
    name: "高等数学",
    credit: 5,
    teacherId: "T001",
    teacherName: "王老师",
    dept: "数学学院",
    desc: "理工科基础课程。",
    requirements: "无特殊要求。",
    status: "published",
    schedule: "周三 3-4节",
    classroom: "H101",
    semester: "2023秋季",
  };

  return courses;
};

const MockData = {
  users: generateExtraUsers(120, TEACHER_POOL),
  courses: generateMockCourses(200),
  enrollments: (() => {
    const students = generateExtraUsers(120, TEACHER_POOL)
      .filter((u) => u.role === "student")
      .map((u) => u.id);
    const courses = generateMockCourses(200);
    return generateMockEnrollments(courses, students);
  })(),
  logs: [
    {
      id: 1,
      user: "SA001",
      action: "System Backup",
      time: "2023-10-01 12:00:00",
    },
    {
      id: 2,
      user: "TA001",
      action: "Create Course C001",
      time: "2023-09-01 09:00:00",
    },
  ],
};

const DB = {
  init() {
    const storedUsers = localStorage.getItem("grade_users");
    if (!storedUsers) {
      localStorage.setItem("grade_users", JSON.stringify(MockData.users));
    } else {
      try {
        const parsed = JSON.parse(storedUsers) || [];
        if (!Array.isArray(parsed)) {
          localStorage.setItem("grade_users", JSON.stringify(MockData.users));
        } else {
          const existing = new Set(
            parsed.map((u) => u && u.id).filter(Boolean)
          );
          const merged = parsed.slice();
          for (const u of MockData.users) {
            if (!existing.has(u.id)) merged.push(u);
          }
          if (merged.length !== parsed.length) {
            localStorage.setItem("grade_users", JSON.stringify(merged));
          }
        }
      } catch (e) {
        localStorage.setItem("grade_users", JSON.stringify(MockData.users));
      }
    }

    const storedCourses = localStorage.getItem("grade_courses");
    if (!storedCourses) {
      localStorage.setItem("grade_courses", JSON.stringify(MockData.courses));
    } else {
      try {
        let parsed = JSON.parse(storedCourses) || [];
        if (!Array.isArray(parsed)) {
          localStorage.setItem(
            "grade_courses",
            JSON.stringify(MockData.courses)
          );
          return;
        }

        // --- 新增：检测并修复旧数据缺失 'semester' 字段的情况 ---
        const semesters = ["2024秋季", "2024春季", "2023秋季", "2023春季"];
        const needsSemester = parsed.some((c) => !c.semester);
        if (needsSemester) {
          parsed = parsed.map((c, idx) => ({
            ...c,
            semester: c.semester || semesters[idx % semesters.length],
          }));
        }

        const mockById = new Map(MockData.courses.map((c) => [c.id, c]));
        const needsRename = parsed.some(
          (c) =>
            c &&
            typeof c.name === "string" &&
            /\（[^）]*\d+[^）]*\）/.test(c.name)
        );

        let updated = parsed;
        if (needsRename) {
          updated = parsed.map((c) => {
            if (
              !c ||
              typeof c.name !== "string" ||
              !/\（[^）]*\d+[^）]*\）/.test(c.name)
            )
              return c;
            const m = mockById.get(c.id);
            if (!m) return c;
            return {
              ...c,
              name: m.name,
              credit: m.credit,
              teacherId: m.teacherId,
              teacherName: m.teacherName,
              dept: m.dept,
              desc: m.desc,
              status: m.status,
              schedule: m.schedule,
              classroom: m.classroom,
              semester: m.semester, // 同步 Mock 数据的学期
            };
          });
        }

        if (updated.length < 200) {
          const existingIds = new Set(
            updated.map((c) => c && c.id).filter(Boolean)
          );
          const toAppend = [];
          for (const c of MockData.courses) {
            if (toAppend.length + updated.length >= 200) break;
            if (!existingIds.has(c.id)) toAppend.push(c);
          }
          if (toAppend.length > 0) {
            updated = updated.concat(toAppend);
          }
        }

        const usersNow = (() => {
          try {
            const u = JSON.parse(localStorage.getItem("grade_users")) || [];
            return Array.isArray(u) ? u : [];
          } catch (e) {
            return [];
          }
        })();
        const teacherUsers = usersNow.filter(
          (u) => u && u.role === "teacher" && u.id
        );
        const teacherIdSet = new Set(teacherUsers.map((t) => t.id));
        if (teacherUsers.length > 2) {
          const courseTeacherIds = new Set(
            updated.map((c) => c && c.teacherId).filter(Boolean)
          );
          const shouldRebind =
            courseTeacherIds.size <= 2 &&
            courseTeacherIds.size < teacherUsers.length;
          const rebinding = shouldRebind
            ? teacherUsers.map((t) => ({
                teacherId: t.id,
                teacherName: t.name,
              }))
            : null;
          let teacherUpdated = false;
          const nextCourses = updated.map((c, idx) => {
            if (!c) return c;
            if (rebinding) {
              const t = rebinding[idx % rebinding.length];
              if (
                c.teacherId !== t.teacherId ||
                c.teacherName !== t.teacherName
              ) {
                teacherUpdated = true;
                return {
                  ...c,
                  teacherId: t.teacherId,
                  teacherName: t.teacherName,
                };
              }
              return c;
            }
            if (!teacherIdSet.has(c.teacherId)) {
              const t = teacherUsers[idx % teacherUsers.length];
              teacherUpdated = true;
              return { ...c, teacherId: t.id, teacherName: t.name };
            }
            return c;
          });
          if (teacherUpdated) {
            updated = nextCourses;
          }
        }

        if (updated !== parsed || needsSemester || needsReq) {
          localStorage.setItem("grade_courses", JSON.stringify(updated));
        }
      } catch (e) {
        localStorage.setItem("grade_courses", JSON.stringify(MockData.courses));
      }
    }

    const storedEnrollments = localStorage.getItem("grade_enrollments");
    if (!storedEnrollments) {
      localStorage.setItem(
        "grade_enrollments",
        JSON.stringify(MockData.enrollments)
      );
    } else {
      try {
        const parsed = JSON.parse(storedEnrollments) || [];
        const current = Array.isArray(parsed) ? parsed : [];
        const courses = this.get("courses");
        const students = this.get("users")
          .filter((u) => u && u.role === "student" && u.id)
          .map((u) => u.id);
        const byCourse = new Map();
        for (const e of current) {
          if (!e || !e.courseId || !e.studentId) continue;
          let set = byCourse.get(e.courseId);
          if (!set) {
            set = new Set();
            byCourse.set(e.courseId, set);
          }
          set.add(e.studentId);
        }

        const additions = [];
        for (const c of courses) {
          const cid = c && c.id;
          if (!cid) continue;
          const set = byCourse.get(cid) || new Set();
          const need = Math.max(0, 5 - set.size);
          if (need <= 0) continue;
          const rand = mulberry32(hashString(String(cid)));
          let guard = 0;
          while (additions.length < 5000 && set.size < 5 && guard < 200) {
            guard++;
            const sid = students[Math.floor(rand() * students.length)];
            if (!sid || set.has(sid)) continue;
            set.add(sid);
            const graded = rand() < 0.4;
            const hw = graded ? Math.round(60 + rand() * 40) : null;
            const mid = graded ? Math.round(60 + rand() * 40) : null;
            const fin = graded ? Math.round(60 + rand() * 40) : null;
            const total = graded
              ? Math.round(hw * 0.3 + mid * 0.3 + fin * 0.4)
              : null;
            additions.push({
              studentId: sid,
              courseId: cid,
              grade: total,
              details: { homework: hw, midterm: mid, final: fin },
            });
          }
          byCourse.set(cid, set);
        }

        if (additions.length > 0) {
          localStorage.setItem(
            "grade_enrollments",
            JSON.stringify(current.concat(additions))
          );
        }
      } catch (e) {
        localStorage.setItem(
          "grade_enrollments",
          JSON.stringify(MockData.enrollments)
        );
      }
    }

    if (!localStorage.getItem("grade_logs")) {
      localStorage.setItem("grade_logs", JSON.stringify(MockData.logs));
    }
  },
  get(table) {
    return JSON.parse(localStorage.getItem("grade_" + table)) || [];
  },
  set(table, data) {
    localStorage.setItem("grade_" + table, JSON.stringify(data));
  },
  async resetPassword(username, newPassword) {
    const users = this.get("users");
    const userIndex = users.findIndex((u) => u.id === username);
    if (userIndex === -1) return { success: false, error: "用户不存在" };

    const user = users[userIndex];
    try {
      const record = await Security.createPasswordRecord(newPassword);
      user.passwordAlgo = record.algo;
      user.passwordIterations = record.iterations;
      user.salt = record.salt;
      user.passwordHash = record.hash;
      user.loginAttempts = 0;
      user.lockUntil = 0;
      // Resetting password via email also clears the forced change flag
      user.mustChangePassword = false;

      users[userIndex] = user;
      this.set("users", users);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async changePassword(username, newPassword) {
    return this.resetPassword(username, newPassword);
  },

  findUser(username) {
    return this.get("users").find((u) => u.id === username);
  },

  async login(username, password) {
    const users = this.get("users");
    const userIndex = users.findIndex((u) => u.id === username);

    if (userIndex === -1) {
      return { success: false, error: "用户不存在" };
    }

    const user = users[userIndex];

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return {
        success: false,
        error: `账号已锁定，请 ${minutesLeft} 分钟后再试`,
      };
    }

    let passOk = false;
    try {
      passOk = await Security.verifyPassword(password, user);
    } catch (e) {
      return {
        success: false,
        error: e && e.message ? e.message : "密码校验失败",
      };
    }

    if (passOk) {
      if (user.passwordAlgo !== "pbkdf2-sha256") {
        try {
          const record = await Security.createPasswordRecord(password);
          user.passwordAlgo = record.algo;
          user.passwordIterations = record.iterations;
          user.salt = record.salt;
          user.passwordHash = record.hash;
        } catch (e) {
          return {
            success: false,
            error: e && e.message ? e.message : "密码迁移失败",
          };
        }
      }
      user.loginAttempts = 0;
      user.lockUntil = 0;
      users[userIndex] = user;
      this.set("users", users);
      return { success: true, user: user };
    }

    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 3) {
      user.lockUntil = Date.now() + 5 * 60 * 1000;
      users[userIndex] = user;
      this.set("users", users);
      return { success: false, error: "密码错误次数过多，账号已锁定5分钟" };
    }
    users[userIndex] = user;
    this.set("users", users);
    return {
      success: false,
      error: `密码错误 (剩余尝试次数: ${3 - user.loginAttempts})`,
    };
  },
};

DB.init();

//日志
// ===== 新增：获取当前用户 =====
function getCurrentUser() {
  // 假设你们用 localStorage 存当前用户
  const currentUserId = localStorage.getItem("current_user_id");
  if (!currentUserId) return null;

  const users = DB.get("users");
  return users.find((u) => u.id === currentUserId) || null;
}

// ===== 新增：操作日志记录函数 =====
DB.log = function (action, details = "") {
  //const currentUser = getCurrentUser();
  const currentUser = app.state.currentUser;
  if (!currentUser || !currentUser.id) {
    console.warn("无法记录日志：用户未登录");
    return;
  }

  // 从 grade_logs 读取现有日志
  const logs = DB.get("logs"); // 注意：这里传 "logs"，实际读 grade_logs

  logs.push({
    user: currentUser.id,
    action: action,
    details: details,
    time: new Date().toISOString(),
  });

  // 保存回 grade_logs
  DB.set("logs", logs);
  console.log("📝 日志已记录:", logs[logs.length - 1]);
};
