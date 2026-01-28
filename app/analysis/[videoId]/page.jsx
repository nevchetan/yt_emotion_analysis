import AnalysisPageClient from "./AnalysisPageClient";

export default async function AnalysisPage({ params }) {
  const resolvedParams = await params;
  const videoId = resolvedParams.videoId;

  return <AnalysisPageClient videoId={videoId} />;
}
