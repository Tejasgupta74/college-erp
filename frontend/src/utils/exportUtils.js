export const INSTITUTION_CONFIG = {
  name: 'COLLEGE ERP SYSTEM',
  location: 'Accredited Institutional ERP System • Punjab, India',
  campus: 'Knowledge Campus, Punjab, India • finance@college.edu',
  accreditation: "Affiliated to State Technical University • Accredited Grade 'A+'",
  footerAuth: 'Official Institutional Document • System-Generated Electronic Record',
};

/**
 * Institutional Header for College ERP Documents
 */
const addInstitutionalHeader = (doc, title, subtitle = '') => {
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, doc.internal.pageSize.width, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(INSTITUTION_CONFIG.name, 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255);
  doc.text(INSTITUTION_CONFIG.location, 14, 18);

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
  doc.text(INSTITUTION_CONFIG.footerAuth, pageWidth - 14, pageHeight - 10, { align: 'right' });
};

/**
 * 1. Generate Fee Receipt PDF (lazy-loaded)
 */
export const exportFeeReceiptPDF = async (fee) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const latestPayment = Array.isArray(fee.payments) && fee.payments.length > 0
    ? fee.payments[fee.payments.length - 1]
    : null;

  const receiptNo = latestPayment?.receiptNo || fee.receiptNo || (fee._id ? `REC-${fee._id.toString().slice(-6).toUpperCase()}` : 'N/A');

  addInstitutionalHeader(doc, 'Official Fee Payment Receipt', `Receipt No: ${receiptNo}`);

  // Metadata Grid
  const studentName = fee.student?.name || 'N/A';
  const enrollmentNo = fee.student?.enrollmentNo || fee.student?.rollNo || 'N/A';
  const deptName = fee.student?.department?.name || fee.department?.name || 'N/A';
  const paymentDate = latestPayment?.date
    ? new Date(latestPayment.date).toLocaleDateString()
    : (fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString() : 'N/A');
  const paymentMethod = (latestPayment?.method || fee.paymentMethod || 'N/A').toUpperCase();

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
      ['Payment Method:', paymentMethod, 'Payment Date:', paymentDate],
      ['Academic Year:', fee.academicYear || '', 'Status:', (fee.status || '').toUpperCase()],
    ],
  });

  // Financial Breakdown & Summary Table
  const totalAmount = Number(fee.totalAmount || fee.amount || 0);
  const paidAmount = Number(fee.paidAmount || (fee.status === 'Paid' ? totalAmount : 0));
  const remainingDue = Math.max(0, totalAmount - paidAmount);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Fee Head / Description', 'Total Billed (INR)', 'Total Settled (INR)', 'Remaining Balance (INR)']],
    body: [
      [
        fee.title || 'Tuition & Academic Fees',
        `Rs. ${totalAmount.toLocaleString()}`,
        `Rs. ${paidAmount.toLocaleString()}`,
        `Rs. ${remainingDue.toLocaleString()}`,
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3.5 },
  });

  // Full Installment Payment History Table
  if (Array.isArray(fee.payments) && fee.payments.length > 0) {
    const paymentRows = fee.payments.map((p, idx) => [
      `#${idx + 1}`,
      p.receiptNo || 'N/A',
      p.transactionId || 'N/A',
      p.date ? new Date(p.date).toLocaleDateString() : 'N/A',
      (p.method || 'N/A').toUpperCase(),
      `Rs. ${Number(p.amount || 0).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Installment', 'Receipt No', 'Transaction ID', 'Date', 'Method', 'Amount (INR)']],
      body: paymentRows,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
    });
  }

  addInstitutionalFooter(doc);
  doc.save(`Fee_Receipt_${receiptNo}.pdf`);
};

/**
 * 2. Generate Student Marksheet / Grade Card PDF (lazy-loaded)
 */
export const exportMarksheetPDF = async (exam, student, results) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  addInstitutionalHeader(
    doc,
    'Institutional Grade Sheet / Marksheet',
    `${exam.name || 'End Semester Examination'}${exam.academicYear ? ' • ' + exam.academicYear : ''}`
  );

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
 * 3. Export Data to Excel (.xlsx) using ExcelJS (lazy-loaded, prototype-pollution free)
 */
export const exportToExcel = async (data, fileName, sheetName = 'Sheet1') => {
  const ExcelJS = await import('exceljs');
  const WorkbookClass = ExcelJS.Workbook || ExcelJS.default?.Workbook;
  const workbook = new WorkbookClass();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data && data.length > 0) {
    const keys = Object.keys(data[0]);
    worksheet.columns = keys.map((key) => ({
      header: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
      key,
      width: Math.max(14, key.length + 4),
    }));

    data.forEach((row) => worksheet.addRow(row));

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${fileName}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * 4. Export Data to CSV (native pure JS, 0 dependencies)
 */
export const exportToCSV = (data, fileName) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...data.map((item) =>
      headers
        .map((h) => {
          const val = item[h] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
