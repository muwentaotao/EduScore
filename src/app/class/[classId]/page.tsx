import { ClassDetailClient } from "@/components/class/class-detail-client";

export default async function ClassDetailPage(props: PageProps<"/class/[classId]">) {
  const { classId } = await props.params;
  return <ClassDetailClient classId={classId} />;
}
