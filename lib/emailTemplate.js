/**
 * Email Template Generator
 * Creates HTML email templates for emotion analysis reports
 */

export function generateEmailHTML(reportData) {
  const {
    videoTitle,
    videoId,
    totalComments,
    analyzedCount,
    emotionStats,
    topEmotion,
    dashboardUrl,
  } = reportData;

  const colorMap = {
    joy: "#FBBF24",
    sadness: "#3B82F6",
    anger: "#EF4444",
    fear: "#A855F7",
    surprise: "#F97316",
    disgust: "#10B981",
    neutral: "#6B7280",
  };

  const emotionBars = emotionStats
    .map((stat) => {
      const color = colorMap[stat.emotion] || "#6B7280";
      const barWidth = Math.max(5, stat.percentage);

      return `
        <tr>
          <td style="padding: 8px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="120" style="font-size: 14px; font-weight: 600; color: #111827; text-transform: capitalize;">
                  ${stat.emotion}
                </td>
                <td>
                  <div style="background: #e5e7eb; border-radius: 9999px; overflow: hidden; height: 16px;">
                    <div style="width: ${barWidth}%; height: 16px; background: ${color};"></div>
                  </div>
                </td>
                <td width="100" align="right" style="font-size: 13px; color: #111827; padding-left: 10px;">
                  ${stat.count} (${stat.percentage}%)
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emotion Analysis Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                📊 Emotion Analysis Report
              </h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">
                Generated on ${new Date().toLocaleString()}
              </p>
            </td>
          </tr>

          <!-- Video Info -->
          <tr>
            <td style="padding: 30px; border-bottom: 2px solid #e5e7eb;">
              <h2 style="color: #111827; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">
                ${videoTitle}
              </h2>
              <p style="color: #6b7280; margin: 0; font-size: 13px;">
                Video ID: ${videoId}
              </p>
            </td>
          </tr>

          <!-- Summary Stats -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33%" align="center" style="padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #4f46e5;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Total Comments</div>
                    <div style="font-size: 32px; font-weight: 700; color: #111827;">${totalComments}</div>
                  </td>
                  <td width="10"></td>
                  <td width="33%" align="center" style="padding: 15px; background-color: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Analyzed</div>
                    <div style="font-size: 32px; font-weight: 700; color: #111827;">${analyzedCount}</div>
                  </td>
                  <td width="10"></td>
                  <td width="33%" align="center" style="padding: 15px; background-color: #ecfdf3; border-radius: 8px; border-left: 4px solid #10b981;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Top Emotion</div>
                    <div style="font-size: 24px; font-weight: 700; color: #111827; text-transform: capitalize;">${topEmotion?.emotion || "N/A"}</div>
                    ${topEmotion ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${topEmotion.percentage}%</div>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Emotion Breakdown -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb;">
              <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
                Emotion Breakdown
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${emotionBars}
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 30px; text-align: center; border-top: 2px solid #e5e7eb;">
              <a href="${dashboardUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Full Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #f3f4f6; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This is an automated email from YouTube Emotion Analysis
              </p>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">
                To stop receiving these reports, delete your schedule from the dashboard
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateEmailText(reportData) {
  const {
    videoTitle,
    videoId,
    totalComments,
    analyzedCount,
    emotionStats,
    topEmotion,
    dashboardUrl,
  } = reportData;

  let text = `
EMOTION ANALYSIS REPORT
Generated on ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VIDEO: ${videoTitle}
Video ID: ${videoId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY STATISTICS:

📊 Total Comments: ${totalComments}
✓ Analyzed: ${analyzedCount}
⭐ Top Emotion: ${topEmotion?.emotion || "N/A"} (${topEmotion?.percentage || 0}%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMOTION BREAKDOWN:

`;

  emotionStats.forEach((stat) => {
    const bars = "█".repeat(Math.floor(stat.percentage / 5));
    text += `${stat.emotion.toUpperCase().padEnd(10)} ${bars} ${stat.count} (${stat.percentage}%)\n`;
  });

  text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View full dashboard: ${dashboardUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated email from YouTube Emotion Analysis.
To stop receiving these reports, delete your schedule from the dashboard.
`;

  return text.trim();
}
