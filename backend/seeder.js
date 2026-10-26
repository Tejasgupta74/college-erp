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

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seeder] Connected to MongoDB');

    // Clear existing data
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
    ]);
    console.log('[Seeder] Cleared previous records.');

    // 1. Create Admin
    const adminUser = await User.create({
      name: 'Super Administrator',
      email: 'admin@college.edu',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 9876543210',
    });

    // 2. Create Accountant
    const accountantUser = await User.create({
      name: 'Ramesh Gupta (Accounts)',
      email: 'accountant@college.edu',
      password: 'Accountant@123',
      role: 'accountant',
      phone: '+91 9876543211',
    });

    // 3. Create Faculty Users
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

    // 4. Create Departments
    const deptCSE = await Department.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'Department of Computer Science and Information Technology',
      hod: facultyUser1._id,
    });

    const deptECE = await Department.create({
      name: 'Electronics & Communication',
      code: 'ECE',
      description: 'Department of Electronics and Telecommunications',
      hod: facultyUser2._id,
    });

    const deptME = await Department.create({
      name: 'Mechanical Engineering',
      code: 'ME',
      description: 'Department of Mechanical and Industrial Engineering',
      hod: null,
    });

    // 5. Create Faculty Profiles
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
        qualification: 'Ph.D. in VLSI Design',
        specialization: 'Embedded Systems & IoT',
        officeRoom: 'Block B, Room 204',
      },
    ]);

    // 6. Create Courses
    const courseDSA = await Course.create({
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      credits: 4,
      department: deptCSE._id,
      semester: 4,
      type: 'Theory',
      faculty: facultyUser1._id,
      description: 'Core concepts of arrays, linked lists, trees, graphs, sorting and asymptotic analysis.',
    });

    const courseDBMS = await Course.create({
      name: 'Database Management Systems',
      code: 'CS202',
      credits: 4,
      department: deptCSE._id,
      semester: 4,
      type: 'Theory',
      faculty: facultyUser1._id,
      description: 'Relational data models, SQL, normalization, transactions, and indexing.',
    });

    const courseOS = await Course.create({
      name: 'Operating Systems',
      code: 'CS203',
      credits: 3,
      department: deptCSE._id,
      semester: 4,
      type: 'Theory',
      faculty: facultyUser1._id,
      description: 'Process scheduling, concurrency, virtual memory, and file systems.',
    });

    const courseDigital = await Course.create({
      name: 'Digital Electronics',
      code: 'EC101',
      credits: 4,
      department: deptECE._id,
      semester: 2,
      type: 'Theory',
      faculty: facultyUser2._id,
      description: 'Boolean algebra, logic gates, combinational and sequential circuit design.',
    });

    // 7. Create Student Users & Profiles
    const studentUser1 = await User.create({
      name: 'Rahul Verma',
      email: 'student@college.edu', // Primary demo student
      password: 'Student@123',
      role: 'student',
      phone: '+91 9123456780',
    });

    const studentProfile1 = await StudentProfile.create({
      user: studentUser1._id,
      enrollmentNo: 'ENR2024CS042',
      rollNo: '24CS042',
      department: deptCSE._id,
      semester: 4,
      section: 'A',
      batchYear: '2024-2028',
      guardianName: 'Sanjay Verma',
      guardianPhone: '+91 9123456700',
      address: '42 Park Street, Bangalore, Karnataka',
      bloodGroup: 'B+',
    });

    const studentUser2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya.sharma@college.edu',
      password: 'Student@123',
      role: 'student',
      phone: '+91 9123456781',
    });

    const studentProfile2 = await StudentProfile.create({
      user: studentUser2._id,
      enrollmentNo: 'ENR2024CS043',
      rollNo: '24CS043',
      department: deptCSE._id,
      semester: 4,
      section: 'A',
      batchYear: '2024-2028',
      guardianName: 'Manoj Sharma',
      guardianPhone: '+91 9123456701',
      address: '15 Indiranagar, Bangalore, Karnataka',
      bloodGroup: 'O+',
    });

    const studentUser3 = await User.create({
      name: 'Amit Kumar',
      email: 'amit.kumar@college.edu',
      password: 'Student@123',
      role: 'student',
      phone: '+91 9123456782',
    });

    const studentProfile3 = await StudentProfile.create({
      user: studentUser3._id,
      enrollmentNo: 'ENR2025EC015',
      rollNo: '25EC015',
      department: deptECE._id,
      semester: 2,
      section: 'A',
      batchYear: '2025-2029',
      guardianName: 'Vijay Kumar',
      guardianPhone: '+91 9123456702',
      address: '77 Koramangala, Bangalore, Karnataka',
      bloodGroup: 'A+',
    });

    // 8. Create Attendance Sessions
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const dates = [new Date(now - 4 * dayMs), new Date(now - 3 * dayMs), new Date(now - 2 * dayMs), new Date(now - 1 * dayMs)];

    await Attendance.create([
      {
        course: courseDSA._id,
        department: deptCSE._id,
        faculty: facultyUser1._id,
        date: dates[0],
        semester: 4,
        section: 'A',
        topicCovered: 'Binary Search Trees and AVL Rotations',
        records: [
          { student: studentUser1._id, status: 'Present' },
          { student: studentUser2._id, status: 'Present' },
        ],
      },
      {
        course: courseDSA._id,
        department: deptCSE._id,
        faculty: facultyUser1._id,
        date: dates[1],
        semester: 4,
        section: 'A',
        topicCovered: 'Graph Traversals (BFS & DFS)',
        records: [
          { student: studentUser1._id, status: 'Present' },
          { student: studentUser2._id, status: 'Absent' },
        ],
      },
      {
        course: courseDBMS._id,
        department: deptCSE._id,
        faculty: facultyUser1._id,
        date: dates[2],
        semester: 4,
        section: 'A',
        topicCovered: 'Normalization (1NF to BCNF)',
        records: [
          { student: studentUser1._id, status: 'Present' },
          { student: studentUser2._id, status: 'Present' },
        ],
      },
      {
        course: courseOS._id,
        department: deptCSE._id,
        faculty: facultyUser1._id,
        date: dates[3],
        semester: 4,
        section: 'A',
        topicCovered: 'Deadlock Detection & Banker Algorithm',
        records: [
          { student: studentUser1._id, status: 'Present' },
          { student: studentUser2._id, status: 'Present' },
        ],
      },
    ]);

    // 9. Create Fee Invoices
    await Fee.create([
      {
        student: studentUser1._id,
        department: deptCSE._id,
        title: 'Semester 4 Tuition & Laboratory Fee',
        semester: 4,
        academicYear: '2025-2026',
        totalAmount: 45000,
        paidAmount: 45000,
        status: 'Paid',
        dueDate: new Date(now + 15 * dayMs),
        payments: [
          {
            amount: 45000,
            transactionId: 'TXN-984210',
            method: 'Online',
            date: new Date(now - 10 * dayMs),
            receiptNo: 'REC-001042',
          },
        ],
      },
      {
        student: studentUser1._id,
        department: deptCSE._id,
        title: 'Annual Library & Tech Infrastructure Fee',
        semester: 4,
        academicYear: '2025-2026',
        totalAmount: 8500,
        paidAmount: 0,
        status: 'Pending',
        dueDate: new Date(now + 20 * dayMs),
        payments: [],
      },
      {
        student: studentUser2._id,
        department: deptCSE._id,
        title: 'Semester 4 Tuition & Laboratory Fee',
        semester: 4,
        academicYear: '2025-2026',
        totalAmount: 45000,
        paidAmount: 20000,
        status: 'Partial',
        dueDate: new Date(now + 10 * dayMs),
        payments: [
          {
            amount: 20000,
            transactionId: 'TXN-871239',
            method: 'UPI',
            date: new Date(now - 5 * dayMs),
            receiptNo: 'REC-001043',
          },
        ],
      },
    ]);

    // 10. Create Exam & Results
    await Exam.create([
      {
        title: 'Mid-Term Examination Fall 2026',
        course: courseDSA._id,
        department: deptCSE._id,
        semester: 4,
        examType: 'Internal/Mid-Term',
        maxMarks: 50,
        passingMarks: 20,
        examDate: new Date(now - 7 * dayMs),
        results: [
          { student: studentUser1._id, marksObtained: 46, grade: 'A+', remarks: 'Outstanding performance' },
          { student: studentUser2._id, marksObtained: 38, grade: 'B', remarks: 'Good understanding of trees and heaps' },
        ],
      },
      {
        title: 'Mid-Term Examination Fall 2026',
        course: courseDBMS._id,
        department: deptCSE._id,
        semester: 4,
        examType: 'Internal/Mid-Term',
        maxMarks: 50,
        passingMarks: 20,
        examDate: new Date(now - 6 * dayMs),
        results: [
          { student: studentUser1._id, marksObtained: 42, grade: 'A', remarks: 'Well-structured ER model solutions' },
          { student: studentUser2._id, marksObtained: 44, grade: 'A+', remarks: 'Excellent SQL query optimization' },
        ],
      },
    ]);

    // 11. Create Notices
    await Notice.create([
      {
        title: 'Mid-Term Examination Schedule Announced',
        content: 'The Mid-Term examination schedule for Semester 2 and Semester 4 has been finalized. Students are advised to check their respective course schedules and admit card eligibility.',
        author: adminUser._id,
        targetAudience: 'all',
        priority: 'Important',
        isPinned: true,
      },
      {
        title: 'Annual Tech Hackathon 2026 Registrations Open',
        content: 'Department of Computer Science is hosting the annual 36-hour inter-college Hackathon. Exciting cash prizes and internship opportunities with top tech companies. Register at the department portal.',
        author: facultyUser1._id,
        targetAudience: 'students',
        priority: 'Normal',
        isPinned: true,
      },
      {
        title: 'Urgent: Semester Fee Payment Deadline approaching',
        content: 'All students with pending Semester 4 fees are requested to clear their dues before the end of this month to avoid a late penalty fee.',
        author: accountantUser._id,
        targetAudience: 'students',
        priority: 'Urgent',
        isPinned: false,
      },
    ]);

    console.log('[Seeder] Data seeded successfully!');
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
