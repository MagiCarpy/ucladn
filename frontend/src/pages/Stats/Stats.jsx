import { useEffect, useState } from "react";
import { fetchUserStats } from "@/api/stats";
import {
  RiBarChartLine,
  RiBox1Line,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiPulseLine,
} from "@remixicon/react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchUserStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading stats...</p>
      </div>
    );
  }

  const { counts, asRequester, asCourier, chart } = stats;

  return (
    <PageContainer className="flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-10 text-foreground dark:text-white">
        Your Activity Overview
      </h1>

      {/* Stats card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        <StatCard
          icon={<RiCheckboxCircleLine className="w-8 h-8 text-white-600" />}
          title="Deliveries Completed"
          value={counts.deliveriesCompleted}
        />

        <StatCard
          icon={<RiBox1Line className="w-8 h-8 text-white-600" />}
          title="Requests Made"
          value={counts.requestsMade}
        />

        <StatCard
          icon={<RiTimeLine className="w-8 h-8 text-white-600" />}
          title="Completed Requests"
          value={counts.requestsCompleted}
        />

        <StatCard
          icon={<RiCheckboxCircleLine className="w-8 h-8 text-white-600" />}
          title="Items Received"
          value={counts.requestsReceived}
        />
      </div>

      {/* Activity chart */}
      <div className="w-full max-w-5xl mt-20">
        <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white">
          Activity Over the Last 14 Days
        </h2>

        <Card className="p-6 bg-card border border-border shadow">
          <ActivityChart chart={chart} />
        </Card>
      </div>

      {/* Activity list */}
      <div className="w-full max-w-5xl mt-20">
        <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white">
          Recent Activity
        </h2>

        <Card className="p-6 bg-card border border-border shadow divide-y">
          {renderRecentActivity(asRequester, asCourier)}
        </Card>
      </div>
    </PageContainer>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <Card className="p-6 bg-card border border-border shadow">
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function ActivityChart({ chart }) {
  const { days, deliveriesPerDay, requestsPerDay } = chart;

  const max = Math.max(...deliveriesPerDay, ...requestsPerDay, 1);
  const height = 140;
  const width = 340;
  const padding = 30;

  const scaleY = (v) => height - (v / max) * height + padding;
  const scaleX = (i) => (i / (days.length - 1)) * width + padding;

  const makePoints = (arr) =>
    arr.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(" ");

  return (
    <svg
      width="100%"
      height={height + padding * 2}
      viewBox={`0 0 ${width + padding * 2} ${height + padding * 2}`}
    >
      {[...Array(max + 1)].map((_, i) => {
        const y = scaleY(i);
        return (
          <line
            key={i}
            x1={padding}
            y1={y}
            x2={width + padding}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {[...Array(max + 1)].map((_, i) => {
        const y = scaleY(i);
        return (
          <text
            key={i}
            x={padding - 8}
            y={y + 4}
            fill="rgba(255,255,255,0.4)"
            fontSize="10"
            textAnchor="end"
          >
            {i}
          </text>
        );
      })}

      {days.map((d, i) => (
        <text
          key={i}
          x={scaleX(i)}
          y={height + padding + 15}
          fill="rgba(255,255,255,0.4)"
          fontSize="10"
          textAnchor="middle"
        >
          {new Date(d).toLocaleDateString("en-US", { weekday: "short" })}
        </text>
      ))}

      <polyline
        fill="none"
        stroke="#377dff"
        strokeWidth="3"
        points={makePoints(deliveriesPerDay)}
      />
      <polyline
        fill="none"
        stroke="#2ecc71"
        strokeWidth="3"
        points={makePoints(requestsPerDay)}
      />

      <g>
        <circle cx={padding} cy={padding - 12} r="4" fill="#377dff" />
        <text x={padding + 10} y={padding - 8} fill="#fff" fontSize="12">
          Deliveries
        </text>

        <circle cx={padding + 100} cy={padding - 12} r="4" fill="#2ecc71" />
        <text x={padding + 110} y={padding - 8} fill="#fff" fontSize="12">
          Requests
        </text>
      </g>
    </svg>
  );
}

function renderRecentActivity(asRequester, asCourier) {
  const events = [];

  asCourier.forEach((req) => {
    events.push({
      type: "delivery",
      text: `Delivered from ${req.pickupLocation} → ${req.dropoffLocation}`,
      time: req.updatedAt,
      status: req.status,
    });
  });

  asRequester.forEach((req) => {
    let txt = `Requested delivery from ${req.pickupLocation}`;
    if (req.status === "completed") txt += " — completed";
    if (req.deliveryStatus === "received") txt += " — marked received";

    events.push({
      type: "request",
      text: txt,
      time: req.updatedAt,
    });
  });

  // Sort newest → oldest
  events.sort((a, b) => new Date(b.time) - new Date(a.time));

  if (events.length === 0)
    return <p className="text-muted-foreground">No activity yet.</p>;

  return events.slice(0, 10).map((e, i) => (
    <div key={i} className="py-3">
      <p className="text-foreground">{e.text}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {new Date(e.time).toLocaleString()}
      </p>
    </div>
  ));
}
