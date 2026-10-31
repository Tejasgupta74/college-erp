import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Department from './models/Department.js';
import Course from './models/Course.js';
import StudentProfile from './models/StudentProfile.js';
import FacultyProfile from './models/FacultyProfile.js';
import Attendance from './models/Attendance.js';
import Fee from './models/Fee.js';
import Exam from './models/Exam.js';
import Notice from './models/Notice.js';
import Notification from './models/Notification.js';

dotenv.config();

const seedData = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Seeder Blocked] Seeder script is strictly prohibited from running when NODE_ENV=production.');
      process.exit(1);
    }

    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      console.error('[Seeder Error] MONGODB_URI is not configured.');
      process.exit(1);
    }

    await mongoose.connect(uri);
    const dbName = mongoose.connection.name;
    console.log(`[Seeder] Connected to MongoDB database: "${dbName}"`);

    // Strict guard: require explicit ALLOW_SEED=true unless in automated test mode
    if (process.env.NODE_ENV !== 'test' && process.env.ALLOW_SEED !== 'true') {
      console.error(`[Seeder Guard Blocked] Database wipe and seed is protected.`);
      console.error('[Seeder Guard Blocked] To explicitly execute the seeder against this database, set ALLOW_SEED=true.');
      process.exit(1);
    }

    // 1. Clear existing collections
    await Promise.all([
      User.deleteMany(),
      Department.deleteMany(),
      Course.deleteMany(),
      StudentProfile.deleteMany(),
      FacultyProfile.deleteMany(),
      Attendance.deleteMany(),
      Fee.deleteMany(),
      Exam.deleteMany(),
      Notice.deleteMany(),
      Notification.deleteMany(),
    ]);
    console.log('[Seeder] Cleared previous records.');

    // 2. Administrators
    const adminUser = await User.create({
      name: 'Super Administrator',
      email: 'admin@college.edu',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 9876543210',
    });

    // 3. Accountant Officers
    const accountantUser = await User.create({
      name: 'Ramesh Gupta (Accounts)',
      email: 'accountant@college.edu',
      password: 'Accountant@123',
      role: 'accountant',
      phone: '+91 9876543211',
    });

    await User.create({
      name: 'Sunita Mehra (Bursar)',
      email: 'sunita.mehra@college.edu',
      password: 'Accountant@123',
      role: 'accountant',
      phone: '+91 9876543214',
    });

    // 4. Faculty Members (5 Faculty across Departments)
    const facultyUser1 = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'prof.sharma@college.edu',
      password: 'Faculty@123',
      role: 'faculty',
      phone: '+91 9876543212',
    });

    const facultyUser2 = await User.create({
      name: 'Dr. Anita Patel',
      email: 'dr.patel@college.edu',
      password: 'Faculty@123',
      role: 'faculty',
      phone: '+91 9876543213',
    });

    const facultyUser3 = await User.create({
      name: 'Prof. Vikram Rao',
      email: 'vikram.rao@college.edu',
      password: 'Faculty@123',
      role: 'faculty',
      phone: '+91 9876543215',
    });

    const facultyUser4 = await User.create({
      name: 'Dr. Neha Kulkarni',
      email: 'neha.kulkarni@college.edu',
      password: 'Faculty@123',
      role: 'faculty',
      phone: '+91 9876543216',
    });

    const facultyUser5 = await User.create({
      name: 'Prof. Arjun Sengupta',
      email: 'arjun.sengupta@college.edu',
      password: 'Faculty@123',
      role: 'faculty',
      phone: '+91 9876543217',
    });

    // 5. Academic Departments (4 Departments)
    const deptCSE = await Department.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'Department of Computer Science, Software Engineering & AI Systems',
      hod: facultyUser1._id,
    });

    const deptECE = await Department.create({
      name: 'Electronics & Communication',
      code: 'ECE',
      description: 'Department of Electronics, Embedded Systems & Telecommunications',
      hod: facultyUser2._id,
    });

    const deptME = await Department.create({
      name: 'Mechanical Engineering',
      code: 'ME',
      description: 'Department of Robotics, Mechatronics and Thermodynamics',
      hod: facultyUser4._id,
    });

    const deptAI = await Department.create({
      name: 'Artificial Intelligence & Data Science',
      code: 'AIDS',
      description: 'Department of Deep Learning, Big Data Analytics and Cognitive Computing',
      hod: facultyUser3._id,
    });

    // 6. Faculty Profiles
    await FacultyProfile.create([
      {
        user: facultyUser1._id,
        employeeId: 'EMP-CSE-001',
        department: deptCSE._id,
        designation: 'Professor & HOD',
        qualification: 'Ph.D. in Computer Science (IIT Bombay)',
        specialization: 'Distributed Systems & Cloud Computing',
        officeRoom: 'Block A, Room 302',
      },
      {
        user: facultyUser2._id,
        employeeId: 'EMP-ECE-002',
        department: deptECE._id,
        designation: 'Associate Professor & HOD',
        qualification: 'Ph.D. in VLSI & Microelectronics',
        specialization: 'Embedded Systems & IoT Devices',
        officeRoom: 'Block B, Room 204',
      },
      {
        user: facultyUser3._id,
        employeeId: 'EMP-AI-003',
        department: deptAI._id,
        designation: 'Associate Professor & HOD',
        qualification: 'Ph.D. in Machine Learning (IISc Bangalore)',
        specialization: 'Neural Networks & Computer Vision',
        officeRoom: 'Block C, Room 108',
      },
      {
        user: facultyUser4._id,
        employeeId: 'EMP-ME-004',
        department: deptME._id,
        designation: 'Professor & HOD',
        qualification: 'Ph.D. in Robotics & Automation',
        specialization: 'Kinematics & Autonomous Robotics',
        officeRoom: 'Block D, Room 401',
      },
      {
        user: facultyUser5._id,
        employeeId: 'EMP-CSE-005',
        department: deptCSE._id,
        designation: 'Assistant Professor',
        qualification: 'M.Tech in Cybersecurity (NIT Surathkal)',
        specialization: 'Applied Cryptography & Cyber Defence',
        officeRoom: 'Block A, Room 310',
      },
    ]);

    // 7. Academic Courses (8 Courses across Departments)
    const courseDSA = await Course.create({
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      credits: 4,
      department: deptCSE._id,
      semester: 4,
      type: 'Theory',
      faculty: facultyUser1._id,
      description: 'Asymptotic complexity, trees, heaps, graph traversals, and dynamic programming.',
    });

    const courseDBMS = await Course.create({
      name: 'Database Management Systems',
      code: 'CS202',
      credits: 4,
      department: deptCSE._id,
      semester: 4,
      type: 'Theory',
      faculty: facultyUser1._id,
      description: 'Relational algebra, SQL, normalization, concurrency control, and indexing architectures.',
    });

    const courseOS = await Course.create({
      name: 'Operating Systems & Concurrency',
      code: 'CS203',
      credits: 3,
      department: deptCSE._id,
      semester: 4,
      type: 'Theory',
      faculty: facultyUser5._id,
      description: 'Kernel architectures, multi-threading, virtual memory paging, and deadlock avoidance.',
    });

    const courseCyber = await Course.create({
      name: 'Information & Network Security',
      code: 'CS204',
      credits: 3,
      department: deptCSE._id,
      semester: 4,
      type: 'Theory',
      faculty: facultyUser5._id,
      description: 'Public key infrastructure, TLS protocols, firewalls, and cryptographic primitives.',
    });

    const courseDigital = await Course.create({
      name: 'Digital Electronics & Microprocessors',
      code: 'EC101',
      credits: 4,
      department: deptECE._id,
      semester: 2,
      type: 'Theory',
      faculty: facultyUser2._id,
      description: 'Boolean algebra, logic synthesis, flip-flops, 8086 microprocessor interfacing.',
    });

    await Course.create({
      name: 'Robotics & Industrial Automation',
      code: 'ME301',
      credits: 4,
      department: deptME._id,
      semester: 6,
      type: 'Theory',
      faculty: facultyUser4._id,
      description: 'Manipulator kinematics, dynamics, trajectory planning, and actuator controls.',
    });

    await Course.create({
      name: 'Applied Machine Learning',
      code: 'AI201',
      credits: 4,
      department: deptAI._id,
      semester: 4,
      type: 'Theory',
      faculty: facultyUser3._id,
      description: 'Supervised & unsupervised learning, gradient boosting, and transformer models.',
    });

    await Course.create({
      name: 'Cloud Computing & DevOps',
      code: 'CS301',
      credits: 3,
      department: deptCSE._id,
      semester: 6,
      type: 'Theory',
      faculty: facultyUser1._id,
      description: 'Microservices, Docker containerization, Kubernetes orchestration, and CI/CD pipelines.',
    });

    // 8. Student Users & Enrolled Profiles (8 Well-Balanced Students)
    const rawStudents = [
      {
        name: 'Rahul Verma',
        email: 'student@college.edu', // Primary Demo Student
        phone: '+91 9123456780',
        enrollmentNo: 'ENR2024CS042',
        rollNo: '24CS042',
        dept: deptCSE._id,
        semester: 4,
        section: 'A',
        batchYear: '2024-2028',
        guardianName: 'Sanjay Verma',
        guardianPhone: '+91 9123456700',
        address: '42 Park Street, Bangalore, Karnataka',
        bloodGroup: 'B+',
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@college.edu',
        phone: '+91 9123456781',
        enrollmentNo: 'ENR2024CS043',
        rollNo: '24CS043',
        dept: deptCSE._id,
        semester: 4,
        section: 'A',
        batchYear: '2024-2028',
        guardianName: 'Manoj Sharma',
        guardianPhone: '+91 9123456701',
        address: '15 Indiranagar, Bangalore, Karnataka',
        bloodGroup: 'O+',
      },
      {
        name: 'Rohan Deshmukh',
        email: 'rohan.deshmukh@college.edu',
        phone: '+91 9123456783',
        enrollmentNo: 'ENR2024CS044',
        rollNo: '24CS044',
        dept: deptCSE._id,
        semester: 4,
        section: 'A',
        batchYear: '2024-2028',
        guardianName: 'Rajesh Deshmukh',
        guardianPhone: '+91 9123456703',
        address: '88 MG Road, Pune, Maharashtra',
        bloodGroup: 'AB+',
      },
      {
        name: 'Ananya Iyer',
        email: 'ananya.iyer@college.edu',
        phone: '+91 9123456784',
        enrollmentNo: 'ENR2024CS045',
        rollNo: '24CS045',
        dept: deptCSE._id,
        semester: 4,
        section: 'A',
        batchYear: '2024-2028',
        guardianName: 'Subramanian Iyer',
        guardianPhone: '+91 9123456704',
        address: '102 Anna Nagar, Chennai, Tamil Nadu',
        bloodGroup: 'A+',
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@college.edu',
        phone: '+91 9123456782',
        enrollmentNo: 'ENR2025EC015',
        rollNo: '25EC015',
        dept: deptECE._id,
        semester: 2,
        section: 'A',
        batchYear: '2025-2029',
        guardianName: 'Vijay Kumar',
        guardianPhone: '+91 9123456702',
        address: '77 Koramangala, Bangalore, Karnataka',
        bloodGroup: 'A+',
      },
      {
        name: 'Sneha Roy',
        email: 'sneha.roy@college.edu',
        phone: '+91 9123456785',
        enrollmentNo: 'ENR2025EC016',
        rollNo: '25EC016',
        dept: deptECE._id,
        semester: 2,
        section: 'A',
        batchYear: '2025-2029',
        guardianName: 'Debabrata Roy',
        guardianPhone: '+91 9123456705',
        address: '23 Salt Lake, Kolkata, West Bengal',
        bloodGroup: 'O-',
      },
      {
        name: 'Kavya Nair',
        email: 'kavya.nair@college.edu',
        phone: '+91 9123456786',
        enrollmentNo: 'ENR2024AI007',
        rollNo: '24AI007',
        dept: deptAI._id,
        semester: 4,
        section: 'A',
        batchYear: '2024-2028',
        guardianName: 'Gopinath Nair',
        guardianPhone: '+91 9123456706',
        address: '56 Panampilly Nagar, Kochi, Kerala',
        bloodGroup: 'B-',
      },
      {
        name: 'Devendra Singh',
        email: 'devendra.singh@college.edu',
        phone: '+91 9123456787',
        enrollmentNo: 'ENR2023ME021',
        rollNo: '23ME021',
        dept: deptME._id,
        semester: 6,
        section: 'A',
        batchYear: '2023-2027',
        guardianName: 'Balwant Singh',
        guardianPhone: '+91 9123456707',
        address: '14 Civil Lines, Jaipur, Rajasthan',
        bloodGroup: 'O+',
      },
    ];

    const studentUsers = [];
    for (const s of rawStudents) {
      const u = await User.create({
        name: s.name,
        email: s.email,
        password: 'Student@123',
        role: 'student',
        phone: s.phone,
      });

      await StudentProfile.create({
        user: u._id,
        enrollmentNo: s.enrollmentNo,
        rollNo: s.rollNo,
        department: s.dept,
        semester: s.semester,
        section: s.section,
        batchYear: s.batchYear,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        address: s.address,
        bloodGroup: s.bloodGroup,
      });

      studentUsers.push(u);
    }

    const [s1, s2, s3, s4, s5, s6, s7, s8] = studentUsers;

    // 9. Attendance Logs (Realistic timeline for CSE Semester 4 students s1..s4)
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const dates = [
      new Date(now - 7 * dayMs),
      new Date(now - 6 * dayMs),
      new Date(now - 5 * dayMs),
      new Date(now - 4 * dayMs),
      new Date(now - 3 * dayMs),
      new Date(now - 2 * dayMs),
      new Date(now - 1 * dayMs),
    ];

    await Attendance.create([
      {
        course: courseDSA._id,
        department: deptCSE._id,
        faculty: facultyUser1._id,
        date: dates[0],
        semester: 4,
        section: 'A',
        topicCovered: 'Balanced Binary Search Trees (AVL & Red-Black)',
        records: [
          { student: s1._id, status: 'Present' },
          { student: s2._id, status: 'Present' },
          { student: s3._id, status: 'Present' },
          { student: s4._id, status: 'Absent' },
        ],
      },
      {
        course: courseDSA._id,
        department: deptCSE._id,
        faculty: facultyUser1._id,
        date: dates[1],
        semester: 4,
        section: 'A',
        topicCovered: 'Graph Algorithms: Breadth-First & Depth-First Search',
        records: [
          { student: s1._id, status: 'Present' },
          { student: s2._id, status: 'Absent' },
          { student: s3._id, status: 'Present' },
          { student: s4._id, status: 'Present' },
        ],
      },
      {
        course: courseDBMS._id,
        department: deptCSE._id,
        faculty: facultyUser1._id,
        date: dates[2],
        semester: 4,
        section: 'A',
        topicCovered: 'Relational Normalization: 1NF through BCNF',
        records: [
          { student: s1._id, status: 'Present' },
          { student: s2._id, status: 'Present' },
          { student: s3._id, status: 'Present' },
          { student: s4._id, status: 'Present' },
        ],
      },
      {
        course: courseDBMS._id,
        department: deptCSE._id,
        faculty: facultyUser1._id,
        date: dates[3],
        semester: 4,
        section: 'A',
        topicCovered: 'ACID Properties and Distributed Transactions',
        records: [
          { student: s1._id, status: 'Present' },
          { student: s2._id, status: 'Present' },
          { student: s3._id, status: 'Absent' },
          { student: s4._id, status: 'Present' },
        ],
      },
      {
        course: courseOS._id,
        department: deptCSE._id,
        faculty: facultyUser5._id,
        date: dates[4],
        semester: 4,
        section: 'A',
        topicCovered: 'Deadlock Avoidance: Bankers Algorithm Simulation',
        records: [
          { student: s1._id, status: 'Present' },
          { student: s2._id, status: 'Present' },
          { student: s3._id, status: 'Present' },
          { student: s4._id, status: 'Present' },
        ],
      },
      {
        course: courseCyber._id,
        department: deptCSE._id,
        faculty: facultyUser5._id,
        date: dates[5],
        semester: 4,
        section: 'A',
        topicCovered: 'Asymmetric Cryptography: RSA and Elliptic Curve Cryptography',
        records: [
          { student: s1._id, status: 'Present' },
          { student: s2._id, status: 'Present' },
          { student: s3._id, status: 'Present' },
          { student: s4._id, status: 'Late' },
        ],
      },
      {
        course: courseDigital._id,
        department: deptECE._id,
        faculty: facultyUser2._id,
        date: dates[6],
        semester: 2,
        section: 'A',
        topicCovered: 'Combinational Logic & Karnaugh Map Simplification',
        records: [
          { student: s5._id, status: 'Present' },
          { student: s6._id, status: 'Present' },
        ],
      },
    ]);

    // 10. Fee Invoices (Multi-category billing)
    await Fee.create([
      {
        student: s1._id,
        department: deptCSE._id,
        title: 'Semester 4 Tuition & Academic Fee',
        semester: 4,
        academicYear: '2025-2026',
        totalAmount: 48000,
        paidAmount: 48000,
        status: 'Paid',
        dueDate: new Date(now + 15 * dayMs),
        payments: [
          {
            amount: 48000,
            transactionId: 'TXN-984210',
            method: 'Online',
            date: new Date(now - 12 * dayMs),
            receiptNo: 'REC-001042',
          },
        ],
      },
      {
        student: s1._id,
        department: deptCSE._id,
        title: 'Annual Library & Tech Infrastructure Fee',
        semester: 4,
        academicYear: '2025-2026',
        totalAmount: 9500,
        paidAmount: 0,
        status: 'Pending',
        dueDate: new Date(now + 25 * dayMs),
        payments: [],
      },
      {
        student: s2._id,
        department: deptCSE._id,
        title: 'Semester 4 Tuition & Laboratory Fee',
        semester: 4,
        academicYear: '2025-2026',
        totalAmount: 48000,
        paidAmount: 24000,
        status: 'Partial',
        dueDate: new Date(now + 10 * dayMs),
        payments: [
          {
            amount: 24000,
            transactionId: 'TXN-871239',
            method: 'UPI',
            date: new Date(now - 6 * dayMs),
            receiptNo: 'REC-001043',
          },
        ],
      },
      {
        student: s3._id,
        department: deptCSE._id,
        title: 'Semester 4 Tuition & Laboratory Fee',
        semester: 4,
        academicYear: '2025-2026',
        totalAmount: 48000,
        paidAmount: 48000,
        status: 'Paid',
        dueDate: new Date(now + 10 * dayMs),
        payments: [
          {
            amount: 48000,
            transactionId: 'TXN-761922',
            method: 'Bank Transfer',
            date: new Date(now - 8 * dayMs),
            receiptNo: 'REC-001044',
          },
        ],
      },
      {
        student: s4._id,
        department: deptCSE._id,
        title: 'Semester 4 Tuition & Laboratory Fee',
        semester: 4,
        academicYear: '2025-2026',
        totalAmount: 48000,
        paidAmount: 15000,
        status: 'Partial',
        dueDate: new Date(now + 5 * dayMs),
        payments: [
          {
            amount: 15000,
            transactionId: 'TXN-552190',
            method: 'UPI',
            date: new Date(now - 4 * dayMs),
            receiptNo: 'REC-001045',
          },
        ],
      },
      {
        student: s5._id,
        department: deptECE._id,
        title: 'Semester 2 Tuition & Hardware Lab Fee',
        semester: 2,
        academicYear: '2025-2026',
        totalAmount: 42000,
        paidAmount: 42000,
        status: 'Paid',
        dueDate: new Date(now + 14 * dayMs),
        payments: [
          {
            amount: 42000,
            transactionId: 'TXN-312098',
            method: 'Online',
            date: new Date(now - 14 * dayMs),
            receiptNo: 'REC-001046',
          },
        ],
      },
      {
        student: s7._id,
        department: deptAI._id,
        title: 'Semester 4 GPU Cloud Lab & Tuition Fee',
        semester: 4,
        academicYear: '2025-2026',
        totalAmount: 52000,
        paidAmount: 0,
        status: 'Pending',
        dueDate: new Date(now + 8 * dayMs),
        payments: [],
      },
    ]);

    // 11. Examinations and Results
    await Exam.create([
      {
        title: 'Mid-Term Evaluation Fall 2026',
        course: courseDSA._id,
        department: deptCSE._id,
        semester: 4,
        examType: 'Internal/Mid-Term',
        maxMarks: 50,
        passingMarks: 20,
        examDate: new Date(now - 10 * dayMs),
        results: [
          { student: s1._id, marksObtained: 47, grade: 'A+', remarks: 'Exceptional mastery of BST and AVL rotations' },
          { student: s2._id, marksObtained: 39, grade: 'B', remarks: 'Good grasp of dynamic programming' },
          { student: s3._id, marksObtained: 44, grade: 'A', remarks: 'Strong problem-solving capability' },
          { student: s4._id, marksObtained: 36, grade: 'C', remarks: 'Needs more focus on graph traversals' },
        ],
      },
      {
        title: 'Mid-Term Evaluation Fall 2026',
        course: courseDBMS._id,
        department: deptCSE._id,
        semester: 4,
        examType: 'Internal/Mid-Term',
        maxMarks: 50,
        passingMarks: 20,
        examDate: new Date(now - 9 * dayMs),
        results: [
          { student: s1._id, marksObtained: 45, grade: 'A', remarks: 'Clean and optimal relational schema designs' },
          { student: s2._id, marksObtained: 48, grade: 'A+', remarks: 'Flawless BCNF decomposition and query tuning' },
          { student: s3._id, marksObtained: 41, grade: 'A', remarks: 'Thorough coverage of transaction locks' },
          { student: s4._id, marksObtained: 35, grade: 'C', remarks: 'Review concurrency control techniques' },
        ],
      },
      {
        title: 'Mid-Term Evaluation Fall 2026',
        course: courseOS._id,
        department: deptCSE._id,
        semester: 4,
        examType: 'Internal/Mid-Term',
        maxMarks: 50,
        passingMarks: 20,
        examDate: new Date(now - 8 * dayMs),
        results: [
          { student: s1._id, marksObtained: 43, grade: 'A', remarks: 'Great comprehension of virtual memory paging' },
          { student: s2._id, marksObtained: 41, grade: 'A', remarks: 'Accurate process synchronization implementation' },
          { student: s3._id, marksObtained: 46, grade: 'A+', remarks: 'Superior answers on Bankers Algorithm' },
          { student: s4._id, marksObtained: 34, grade: 'C', remarks: 'Revise kernel scheduler policies' },
        ],
      },
      {
        title: 'Mid-Term Evaluation Fall 2026',
        course: courseCyber._id,
        department: deptCSE._id,
        semester: 4,
        examType: 'Internal/Mid-Term',
        maxMarks: 50,
        passingMarks: 20,
        examDate: new Date(now - 7 * dayMs),
        results: [
          { student: s1._id, marksObtained: 46, grade: 'A+', remarks: 'Comprehensive explanation of RSA key exchange' },
          { student: s2._id, marksObtained: 42, grade: 'A', remarks: 'Sound knowledge of network attack vectors' },
          { student: s3._id, marksObtained: 45, grade: 'A', remarks: 'High quality cryptographic proofs' },
          { student: s4._id, marksObtained: 38, grade: 'B', remarks: 'Good overall effort' },
        ],
      },
      {
        title: 'Internal Assessment I Fall 2026',
        course: courseDigital._id,
        department: deptECE._id,
        semester: 2,
        examType: 'Internal/Mid-Term',
        maxMarks: 50,
        passingMarks: 20,
        examDate: new Date(now - 6 * dayMs),
        results: [
          { student: s5._id, marksObtained: 44, grade: 'A', remarks: 'Precise circuit reduction and state machines' },
          { student: s6._id, marksObtained: 46, grade: 'A+', remarks: 'Outstanding logic synthesis' },
        ],
      },
    ]);

    // 12. Institutional Notices & Bulletins
    await Notice.create([
      {
        title: 'Mid-Term Examination Results Published',
        content: 'The Mid-Term examination results for Semester 2 and Semester 4 have been compiled and published. Students can view and download their official digital grade cards from the Exam portal.',
        author: adminUser._id,
        targetAudience: 'all',
        priority: 'Important',
        isPinned: true,
      },
      {
        title: 'Annual College Inter-College Hackathon 2026 Registrations Open',
        content: 'Department of Computer Science is hosting the annual 36-hour inter-college Hackathon with ₹2,00,000 in grand prizes. Tracks include AI Agents, Cloud Scalability, and Web3.',
        author: facultyUser1._id,
        targetAudience: 'students',
        priority: 'Normal',
        isPinned: true,
      },
      {
        title: 'Semester Fee Payment & Examination Hall Ticket Notice',
        content: 'All students are reminded that clearance of outstanding semester dues is mandatory for examination hall ticket generation. Please contact the Accounts Office for any fee installment queries.',
        author: accountantUser._id,
        targetAudience: 'students',
        priority: 'Urgent',
        isPinned: false,
      },
      {
        title: 'Guest Lecture on LLMs in Enterprise by Google DeepMind Researcher',
        content: 'We are thrilled to announce a guest lecture on Advanced Agentic Architectures in Main Auditorium on Friday at 3:00 PM. All CSE & AI students and faculty are cordially invited.',
        author: facultyUser3._id,
        targetAudience: 'all',
        priority: 'Normal',
        isPinned: false,
      },
    ]);

    // 13. In-App Notifications for Demo Student
    await Notification.create([
      {
        recipient: s1._id,
        title: 'Marksheet Released: Mid-Term Evaluation',
        message: 'Your report card for Data Structures, DBMS, and OS is now ready for view and download.',
        category: 'EXAM',
        link: '/exams',
        isRead: false,
      },
      {
        recipient: s1._id,
        title: 'Fee Payment Received (₹48,000)',
        message: 'Your fee payment for Semester 4 Tuition has been processed. Download receipt REC-001042.',
        category: 'FEE',
        link: '/fees',
        isRead: true,
        readAt: new Date(now - 10 * dayMs),
      },
      {
        recipient: s1._id,
        title: 'Attendance Status: 100% Eligible',
        message: 'You have maintained > 85% attendance across all registered courses this semester.',
        category: 'ATTENDANCE',
        link: '/attendance',
        isRead: false,
      },
    ]);

    console.log('[Seeder] Data seeded successfully into MongoDB Atlas!');
    console.log('----------------------------------------------------');
    console.log('Institutional Summary Seeded:');
    console.log('• Departments: 4 (CSE, ECE, ME, AIDS)');
    console.log('• Faculty:     5 (HODs & Professors)');
    console.log('• Courses:     8 (Core & Specializations)');
    console.log('• Students:    8 (Spread across batches)');
    console.log('• Attendance:  7 Class sessions');
    console.log('• Exams:       5 Comprehensive evaluations');
    console.log('• Fees:        7 Multi-status invoices');
    console.log('• Notices:     4 Institutional notices');
    console.log('----------------------------------------------------');
    console.log('Credentials Summary:');
    console.log('Super Admin: admin@college.edu / Admin@123');
    console.log('Faculty:     prof.sharma@college.edu / Faculty@123');
    console.log('Student:     student@college.edu / Student@123');
    console.log('Accountant:  accountant@college.edu / Accountant@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error]: ${error.message}`);
    process.exit(1);
  }
};

seedData();
