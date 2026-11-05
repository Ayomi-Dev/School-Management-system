import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReportCardPdfData } from "@/src/services/reportCard/reportCardDownload.service";

const styles = StyleSheet.create({
  page: { paddingTop: 34, paddingHorizontal: 38, paddingBottom: 48, fontFamily: "Helvetica", fontSize: 9, color: "#1f2937" },
  topRule: { height: 5, marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  schoolName: { fontSize: 19, fontFamily: "Helvetica-Bold", marginBottom: 5 },
  schoolDetail: { fontSize: 8, color: "#6b7280", marginBottom: 2 },
  documentLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#374151", textAlign: "right" },
  status: { fontSize: 8, marginTop: 6, textAlign: "right", color: "#4b5563" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#d1d5db", marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 9, color: "#111827" },
  details: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  detail: { width: "33.33%", marginBottom: 10, paddingRight: 8 },
  label: { fontSize: 7, color: "#6b7280", marginBottom: 3, textTransform: "uppercase" },
  value: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  stats: { flexDirection: "row", marginBottom: 18, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  stat: { flexGrow: 1, width: "25%", paddingVertical: 10, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: "#e5e7eb" },
  statValue: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  statLabel: { fontSize: 7, color: "#6b7280" },
  table: { marginBottom: 18 },
  tableHeader: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 6, backgroundColor: "#eff6ff", borderBottomWidth: 1, borderBottomColor: "#bfdbfe" },
  tableHeaderText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#1e3a8a" },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  subject: { width: "35%" },
  score: { width: "12%", textAlign: "center" },
  grade: { width: "12%", textAlign: "center" },
  remark: { width: "17%", textAlign: "center" },
  noScores: { padding: 14, textAlign: "center", color: "#6b7280", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  attendance: { flexDirection: "row", gap: 20, marginBottom: 18 },
  attendanceItem: { flexDirection: "row", gap: 4 },
  note: { marginBottom: 9 },
  noteLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", marginBottom: 3 },
  noteText: { fontSize: 9, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 20, left: 38, right: 38, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 7, flexDirection: "row", justifyContent: "space-between", color: "#6b7280", fontSize: 7 },
});

const safeColor = (color: string) => /^#[0-9a-f]{6}$/i.test(color) ? color : "#1D4ED8";
const displayScore = (value: number | null) => value == null ? "—" : `${value}`;

export function createReportCardPdfDocument(data: ReportCardPdfData) {
  const accent = safeColor(data.school.primaryColor);
  const fullName = `${data.student.firstName} ${data.student.lastName}`;

  return (
    <Document title={`${fullName} - ${data.reportCard.term} Report Card`} author={data.school.name}>
      <Page size="A4" style={styles.page} wrap>
        <View style={[styles.topRule, { backgroundColor: accent }]} />
        <View style={styles.header}>
          <View>
            <Text style={styles.schoolName}>{data.school.name}</Text>
            {data.school.address && <Text style={styles.schoolDetail}>{data.school.address}</Text>}
            {[data.school.phone, data.school.email].filter(Boolean).length > 0 && (
              <Text style={styles.schoolDetail}>{[data.school.phone, data.school.email].filter(Boolean).join("  ·  ")}</Text>
            )}
          </View>
          <View>
            <Text style={[styles.documentLabel, { color: accent }]}>STUDENT REPORT CARD</Text>
            <Text style={styles.status}>{data.reportCard.status === "PUBLISHED" ? "Published" : "Compiled · Draft"}</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Student information</Text>
        <View style={styles.details}>
          <Detail label="Student name" value={fullName} />
          <Detail label="Student number" value={data.student.studentNumber} />
          <Detail label="Class" value={data.student.className} />
          <Detail label="Gender" value={data.student.gender} />
          <Detail label="Academic year" value={data.reportCard.academicYear} />
          <Detail label="Term" value={data.reportCard.term} />
          <Detail label="Term dates" value={`${new Date(data.reportCard.termStart).toLocaleDateString()} – ${new Date(data.reportCard.termEnd).toLocaleDateString()}`} />
        </View>

        <View style={styles.stats}>
          <Stat label="TOTAL SCORE" value={displayScore(data.reportCard.totalScore)} />
          <Stat label="AVERAGE" value={data.reportCard.average == null ? "—" : `${data.reportCard.average}%`} />
          <Stat label="CLASS POSITION" value={data.reportCard.position == null ? "—" : `#${data.reportCard.position}`} />
          <Stat label="SUBJECTS SCORED" value={`${data.scores.length}`} last />
        </View>

        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Subject performance</Text>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderText, styles.subject]}>SUBJECT</Text>
            <Text style={[styles.tableHeaderText, styles.score]}>CA / 40</Text>
            <Text style={[styles.tableHeaderText, styles.score]}>EXAM / 60</Text>
            <Text style={[styles.tableHeaderText, styles.score]}>TOTAL</Text>
            <Text style={[styles.tableHeaderText, styles.grade]}>GRADE</Text>
            <Text style={[styles.tableHeaderText, styles.remark]}>REMARK</Text>
          </View>
          {data.scores.length ? data.scores.map((score, index) => (
            <View style={[styles.tableRow, index % 2 === 1 ? { backgroundColor: "#f9fafb" } : {}]} key={`${score.subjectName}-${index}`} wrap={false}>
              <Text style={styles.subject}>{score.subjectCode ? `${score.subjectName} (${score.subjectCode})` : score.subjectName}</Text>
              <Text style={styles.score}>{displayScore(score.caScore)}</Text>
              <Text style={styles.score}>{displayScore(score.examScore)}</Text>
              <Text style={styles.score}>{displayScore(score.totalScore)}</Text>
              <Text style={styles.grade}>{score.grade ?? "—"}</Text>
              <Text style={styles.remark}>{score.gradeRemark ?? "—"}</Text>
            </View>
          )) : <Text style={styles.noScores}>No completed subject scores are available.</Text>}
        </View>

        <Text style={styles.sectionTitle}>Attendance</Text>
        <View style={styles.attendance}>
          <Attendance label="Sessions" value={data.attendance.sessions} />
          <Attendance label="Present" value={data.attendance.present} />
          <Attendance label="Late" value={data.attendance.late} />
          <Attendance label="Absent" value={data.attendance.absent} />
        </View>

        {data.reportCard.teacherRemark && <Remark label="Class teacher's remark" value={data.reportCard.teacherRemark} />}
        {data.reportCard.principalRemark && <Remark label="Principal's remark" value={data.reportCard.principalRemark} />}

        <View style={styles.footer} fixed>
          <Text>{data.school.footer ?? data.school.name}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

function Stat({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.stat, last ? { borderRightWidth: 0 } : {}]}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Attendance({ label, value }: { label: string; value: number }) {
  return <View style={styles.attendanceItem}><Text style={{ fontFamily: "Helvetica-Bold" }}>{value}</Text><Text style={{ color: "#6b7280" }}>{label}</Text></View>;
}

function Remark({ label, value }: { label: string; value: string }) {
  return <View style={styles.note} wrap={false}><Text style={styles.noteLabel}>{label}</Text><Text style={styles.noteText}>{value}</Text></View>;
}
