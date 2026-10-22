// A one-page PDF saying "Sample manuscript: dummy content". Used by the tests and the seed.
//
// Payload checks the end of an uploaded PDF for an `xref` table, so the file is built with
// a real cross-reference table (byte offsets worked out here) rather than written out by hand.
const TEXT = 'Sample manuscript: dummy content'

function buildPdf(): string {
  const stream = `BT /F1 18 Tf 72 760 Td (${TEXT}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  // Everything here is plain ASCII, so a string's length is its length in bytes.
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((body, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  return pdf
}

const SAMPLE_PDF = buildPdf()

export function samplePdf(name = 'sample-manuscript.pdf') {
  const data = Buffer.from(SAMPLE_PDF, 'latin1')
  return { data, mimetype: 'application/pdf', name, size: data.length }
}
