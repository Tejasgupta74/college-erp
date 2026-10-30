import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Institutional Header for College ERP Documents
 */
const addInstitutionalHeader = (doc, title, subtitle = '') => {
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, doc.internal.pageSize.width, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('COLLEGE ERP SYSTEM', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255);
  doc.text('Accredited Institutional ERP System • New Delhi, India', 14, 18);

  // Document Title Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(title.toUpperCase(), 14, 34);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 40);
  }

  // Horizontal divider rule
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 44, doc.internal.pageSize.width - 14, 44);
};

/**
 * Institutional Footer with timestamp and authenticity tag
 */
const addInstitutionalFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const dateStr = new Date().toLocaleString();
  doc.text(`Generated: ${dateStr} • College ERP System`, 14, pageHeight - 10);
  doc.text('Official Institutional Document • Valid without physical signature', pageWidth - 14, pageHeight - 10, { align: 'right' });
};

/**
 * 1. Generate Fee Receipt PDF
 */
export const exportFeeReceiptPDF = (fee) => {
  const doc = new jsPDF();
  const receiptNo = fee.receiptNo || `REC-${fee._id.toString().slice(-8).toUpperCase()}`;

  addInstitutionalHeader(doc, 'Official Fee Payment Receipt', `Receipt No: ${receiptNo}`);

  // Metadata Grid
  const studentName = fee.student?.name || 'N/A';
  const enrollmentNo = fee.student?.enrollmentNo || fee.student?.rollNo || 'N/A';
  const deptName = fee.student?.department?.name || 'N/A';
  const paymentDate = new Date(fee.paymentDate || fee.createdAt || Date.now()).toLocaleDateString();

  autoTable(doc, {
    startY: 48,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2, textColor: [51, 65, 85] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: [100, 116, 139] },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 35, textColor: [100, 116, 139] },
      3: { cellWidth: 60 },
    },
    body: [
      ['Student Name:', studentName, 'Enrollment No:', enrollmentNo],
      ['Department:', deptName, 'Semester:', fee.semester ? `Semester ${fee.semester}` : 'N/A'],
      ['Payment Method:', (fee.paymentMethod || 'Online').toUpperCase(), 'Payment Date:', paymentDate],
      ['Academic Year:', fee.academicYear || '2024-2025', 'Status:', (fee.status || 'PAID').toUpperCase()],
    ],
  });

  // Financial Breakdown Table
  const breakdownRows = [];
  if (fee.breakdown && typeof fee.breakdown === 'object') {
    Object.entries(fee.breakdown).forEach(([key, val]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      breakdownRows.push([formattedKey, `Rs. ${Number(val || 0).toLocaleString()}`]);
    });
  }

  if (breakdownRows.length === 0) {
    breakdownRows.push(['Tuition Fee', `Rs. ${Number(fee.amount || 0).toLocaleString()}`]);
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Fee Head / Component', 'Amount (INR)']],
    body: [
      ...breakdownRows,
      [{ content: 'Total Paid Amount', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
       { content: `Rs. ${Number(fee.amount || 0).toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [79, 70, 229] } }],
    ],
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3.5 },
  });

  addInstitutionalFooter(doc);
  doc.save(`Fee_Receipt_${receiptNo}.pdf`);
};

/**
 * 2. Generate Student Marksheet / Grade Card PDF
 */
export const exportMarksheetPDF = (exam, student, results) => {
  const doc = new jsPDF();
  addInstitutionalHeader(doc, 'Institutional Grade Sheet / Marksheet', `${exam.name || 'End Semester Examination'} • ${exam.academicYear || '2024-2025'}`);

  autoTable(doc, {
    startY: 48,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2, textColor: [51, 65, 85] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: [100, 116, 139] },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 35, textColor: [100, 116, 139] },
      3: { cellWidth: 60 },
    },
    body: [
      ['Student Name:', student?.name || 'N/A', 'Roll / Enrollment:', student?.rollNo || student?.enrollmentNo || 'N/A'],
      ['Department:', student?.department?.name || 'N/A', 'Semester:', `Semester ${exam.semester || 1}`],
      ['Examination Type:', exam.type ? exam.type.toUpperCase() : 'SEMESTER', 'Issue Date:', new Date().toLocaleDateString()],
    ],
  });

  const tableBody = results.map((r, i) => [
    i + 1,
    r.subjectCode || 'SUB',
    r.subjectName || 'Course Subject',
    r.maxMarks || 100,
    r.marksObtained ?? 'Ab',
    r.grade || 'P',
  ]);

  const totalMax = results.reduce((sum, r) => sum + (r.maxMarks || 100), 0);
  const totalObtained = results.reduce((sum, r) => sum + (Number(r.marksObtained) || 0), 0);
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['#', 'Code', 'Subject Title', 'Max Marks', 'Obtained', 'Grade']],
    body: [
      ...tableBody,
      [
        { content: 'Aggregate Overall', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: String(totalMax), styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: `${totalObtained} (${percentage}%)`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [79, 70, 229] } },
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  addInstitutionalFooter(doc);
  doc.save(`Marksheet_${student?.rollNo || 'Student'}_Sem${exam.semester || 1}.pdf`);
};

/**
 * 3. Export Data to Excel (.xlsx)
 */
export const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * 4. Export Data to CSV
 */
export const exportToCSV = (data, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
