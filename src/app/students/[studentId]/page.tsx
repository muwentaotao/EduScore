import { StudentDetailClient } from "@/components/students/student-detail-client";

export const dynamic = "force-dynamic";

export default function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  return <StudentDetailClientWrapper params={params} />;
}

async function StudentDetailClientWrapper({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <StudentDetailClient studentId={studentId} />;
}
