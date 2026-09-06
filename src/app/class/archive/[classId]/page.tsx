import { ClassDetailClient } from "@/components/class/class-detail-client";

export const dynamic = "force-dynamic";

export default async function ArchivedClassDetailPage(
  props: PageProps<"/class/archive/[classId]">
) {
  const { classId } = await props.params;
  return <ClassDetailClient classId={classId} mode="archived" />;
}
