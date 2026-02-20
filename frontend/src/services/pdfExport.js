import { jsPDF } from "jspdf";

export function exportToPDF(title, content) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const lines = doc.splitTextToSize(content, maxWidth);
  doc.text(lines, margin, 35);

  doc.save(`${title}.pdf`);
}