import { X, Printer, GraduationCap } from 'lucide-react';

export const TranscriptModal = ({ isOpen, onClose, reportCard, studentProfile, userName }) => {
  if (!isOpen || !Array.isArray(reportCard)) return null;

  const handlePrint = () => window.print();

  const gradePointsMap = { 'A+': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'P': 5, 'F': 0 };

  let totalCredits = 0;
  let earnedCredits = 0;
  let totalGradePoints = 0;

  reportCard.forEach((item) => {
    const credits = Number(item.credits) || 3;
    totalCredits += credits;
    const gp = gradePointsMap[item.grade] ?? 0;
    totalGradePoints += gp * credits;
    if (item.isPassed) earnedCredits += credits;
  });

  const sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between print:hidden">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-600">Official Semester Grade Sheet</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Transcript
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Transcript Paper */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white" id="printable-transcript">
          {/* Header */}
          <div className="text-center pb-6 border-b-2 border-indigo-900/10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-700 text-white shadow-md mb-2">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="font-extrabold text-xl text-slate-900 tracking-tight uppercase">Apex Institute of Technology</h1>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">Autonomous Institution • Approved by AICTE & UGC</p>
            <p className="text-[11px] text-indigo-700 font-bold uppercase tracking-widest mt-2 bg-indigo-50 inline-block px-4 py-1 rounded-full border border-indigo-200">
              Grade Sheet & Academic Transcript
            </p>
          </div>

          {/* Student Dossier Matrix */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Candidate Name</span>
              <span className="font-bold text-slate-900">{userName || 'Student'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Enrollment No</span>
              <span className="font-mono font-bold text-indigo-700">{studentProfile?.enrollmentNo || 'ENR2024CS042'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Roll Number</span>
              <span className="font-mono font-bold text-slate-800">{studentProfile?.rollNo || '24CS042'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Semester / Branch</span>
              <span className="font-semibold text-slate-800">
                Sem {studentProfile?.semester || 4} • {studentProfile?.department?.code || 'CSE'}
              </span>
            </div>
          </div>

          {/* Course Grades Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-3 text-center">Credits</th>
                  <th className="py-2.5 px-3 text-center">Max</th>
                  <th className="py-2.5 px-3 text-center">Scored</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportCard.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{item.courseCode}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.courseName}</td>
                    <td className="py-2.5 px-3 text-center font-medium">{item.credits}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">{item.maxMarks}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.marksObtained}</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-indigo-700 bg-indigo-50/50">{item.grade}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {item.isPassed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SGPA & Cumulative Performance Summary Card */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-indigo-900/60 uppercase">Credits Status</span>
              <p className="font-semibold text-slate-800">
                Registered: <strong>{totalCredits}</strong> • Earned: <strong>{earnedCredits}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-indigo-900/60 uppercase block">Semester SGPA</span>
              <span className="text-2xl font-black text-indigo-700">{sgpa}</span>
              <span className="text-[10px] text-slate-500 block">Scale: 10.0</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 flex items-end justify-between border-t border-slate-200 text-xs">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400">Date of Issue: {new Date().toLocaleDateString()}</p>
              <p className="text-[10px] text-slate-400 font-mono">Doc Hash: {Math.random().toString(36).substring(2, 12).toUpperCase()}</p>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 pb-1 mb-1 font-serif text-slate-800 italic font-bold">
                Controller of Exams
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Evaluation Authority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptModal;
