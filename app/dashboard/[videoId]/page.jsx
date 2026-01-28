import DashboardClient from "./DashboardClient";

export default async function DashboardPage({ params }) {
  const resolvedParams = await params;
  const videoId = resolvedParams.videoId;

  return <DashboardClient videoId={videoId} />;
}

