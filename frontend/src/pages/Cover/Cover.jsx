import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserStats } from "@/api/stats";
import {
  RiBox1Line,
  RiAddCircleLine,
  RiMap2Line,
  RiUserLine,
  RiBarChartLine,
  RiDoubleQuotesL,
  RiAlertLine,
} from "@remixicon/react";
import { PageContainer } from "@/components/layout/PageContainer";
import u1 from "@/assets/cover/ucla1.jpg";
import u2 from "@/assets/cover/ucla2.jpg";
import u3 from "@/assets/cover/ucla3.jpg";
import u4 from "@/assets/cover/ucla4.jpg";

function Cover() {
  const { user } = useAuth();

  const images = [u1, u2, u3, u4];
  const [index, setIndex] = useState(0);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    fetchUserStats()
      .then(setUserStats)
      .catch(() => setUserStats(null));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 12000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="w-full bg-background flex flex-col items-center">
      {/* ========================================================= */}
      {/* HERO — stays left-aligned, but we give more spacing below */}
      {/* ========================================================= */}
      <div className="relative w-full h-80 sm:h-[28rem] md:h-[36rem] overflow-hidden">
        {/* Sliding images */}
        <div
          className="absolute inset-0 flex transition-transform duration-[1800ms] ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src) => (
            <img
              key={src}
              src={src}
              alt="UCLA Campus"
              className="w-full h-full object-cover flex-shrink-0"
            />
          ))}
        </div>

        {/* Bottom gradient */}
        <div
          className="absolute inset-x-0 bottom-0 h-[75%]
                        bg-gradient-to-b from-transparent via-background/40 to-background"
        />

        {/* Text Overlay */}
        <div className="absolute bottom-10 left-10 max-w-xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground dark:text-white drop-shadow-xl">
            {user ? `Welcome back, ${user.username}!` : "UCLA Delivery Network"}
          </h1>

          <p className="mt-4 text-lg sm:text-xl text-foreground/80 dark:text-white/90 drop-shadow">
            Fast, reliable peer-to-peer deliveries across campus — powered by
            Bruins.
          </p>
        </div>
      </div>

      {/* BIG SPACER */}
      <div className="h-20" />

      {/* ========================================================= */}
      {/* LEFT-ALIGNED INTRO SECTION (balances the hero) */}
      {/* ========================================================= */}
      <PageContainer className="py-0">
        <h2 className="text-3xl font-bold text-foreground dark:text-white mb-6">
          Get Stuff Delivered. Help Other Bruins. Save Time.
        </h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed text-lg">
          Whether you're locked in Powell during midterms, stuck at practice, or
          too tired to walk from Sproul to Rieber for the fifteenth time today —
          this is the fastest way to get what you need across campus.
        </p>
      </PageContainer>

      {/* medium spacer */}
      <div className="h-24" />

      {/* ========================================================= */}
      {/* ACTION GRID */}
      {/* ========================================================= */}
      <PageContainer className="py-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <Link to="/requests/new">
            <div className="p-8 rounded-lg border border-border shadow bg-card hover:shadow-lg transition">
              <RiAddCircleLine className="w-10 h-10 mb-4 text-blue-600" />
              <h3 className="font-semibold text-xl mb-2">Create a Request</h3>
              <p className="text-sm text-muted-foreground">
                Need food or an item delivered? Post what you need.
              </p>
            </div>
          </Link>

          <Link to="/requests">
            <div className="p-8 rounded-lg border border-border shadow bg-card hover:shadow-lg transition">
              <RiBox1Line className="w-10 h-10 mb-4 text-blue-600" />
              <h3 className="font-semibold text-xl mb-2">Browse Requests</h3>
              <p className="text-sm text-muted-foreground">
                View open deliveries and help fellow Bruins.
              </p>
            </div>
          </Link>

          <Link to="/dashboard">
            <div className="p-8 rounded-lg border border-border shadow bg-card hover:shadow-lg transition">
              <RiMap2Line className="w-10 h-10 mb-4 text-blue-600" />
              <h3 className="font-semibold text-xl mb-2">Open Map</h3>
              <p className="text-sm text-muted-foreground">
                Track pickup/delivery routes in real time.
              </p>
            </div>
          </Link>

          <Link to="/profile">
            <div className="p-8 rounded-lg border border-border shadow bg-card hover:shadow-lg transition">
              <RiUserLine className="w-10 h-10 mb-4 text-blue-600" />
              <h3 className="font-semibold text-xl mb-2">Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                Update your info, image, and details.
              </p>
            </div>
          </Link>

          <Link to="/stats">
            <div className="p-8 rounded-lg border border-border shadow bg-card hover:shadow-lg transition cursor-pointer">
              <RiBarChartLine className="w-10 h-10 mb-4 text-blue-600" />
              <h3 className="font-semibold text-xl mb-2">Your Stats</h3>
              <p className="text-sm text-muted-foreground">
                Deliveries completed:{" "}
                {userStats?.counts?.deliveriesCompleted ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Requests made: {userStats?.counts?.requestsMade ?? 0}
              </p>
            </div>
          </Link>
        </div>
      </PageContainer>

      {/* Spacer */}
      <div className="h-32" />

      {/* How it works */}
      <PageContainer className="py-0 text-center">
        <h2 className="text-3xl font-bold mb-10 text-foreground dark:text-white">
          How It Works
        </h2>

        <div className="h-12" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-14 text-center">
          <div>
            <RiAddCircleLine className="w-12 h-12 mx-auto text-blue-600" />
            <h3 className="mt-4 text-lg font-semibold">Post a Request</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Describe what you need and where it should go.
            </p>
          </div>

          <div>
            <RiBox1Line className="w-12 h-12 mx-auto text-blue-600" />
            <h3 className="mt-4 text-lg font-semibold">Get Matched</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A Bruin courier accepts and picks up your item.
            </p>
          </div>

          <div>
            <RiMap2Line className="w-12 h-12 mx-auto text-blue-600" />
            <h3 className="mt-4 text-lg font-semibold">Track Delivery</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Follow real-time progress until it arrives.
            </p>
          </div>
        </div>
      </PageContainer>

      {/* BIG SPACER */}
      <div className="h-32" />

      {/* ========================================================= */}
      {/* HUMOROUS MULTI-AI WARNINGS (left-aligned, big spacing) */}
      {/* ========================================================= */}
      <PageContainer className="py-0">
        <h2 className="text-3xl font-bold mb-10 text-foreground dark:text-white">
          The People Love Us!
        </h2>

        <div className="space-y-10">
          {/* ChatGPT */}
          <div className="p-8 rounded-lg border border-border bg-card shadow">
            <div className="flex items-center gap-3 mb-4">
              <RiDoubleQuotesL className="text-yellow-500 w-6 h-6" />
              <h3 className="font-semibold text-xl">ChatGPT</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg break-words">
              “This website is held together by the software equivalent of a
              paperclip, two rubber bands, and someone whispering ‘please don’t
              explode.’ If it ever launches, I will personally deny
              involvement.”
            </p>
          </div>

          {/* Claude */}
          <div className="p-8 rounded-lg border border-border bg-card shadow">
            <div className="flex items-center gap-3 mb-4">
              <RiDoubleQuotesL className="text-yellow-500 w-6 h-6" />
              <h3 className="font-semibold text-xl">Claude</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg break-words">
              “Hello, We’ve noticed a high number of Claude interactions
              associated with your API access that may violate our Acceptable
              Use Policy. Because it’s a widespread issue, we’ve applied a
              safety filter to your API usage. Anthropic’s safety filter is a
              real-time tool that detects and modifies harmful prompts to reduce
              the likelihood of conversations which violate our policies.
              Regards, Anthropic’s Trust & Safety Team”
            </p>
          </div>

          {/* Our Unpaid Software Intern */}
          <div className="p-8 rounded-lg border border-border bg-card shadow">
            <div className="flex items-center gap-3 mb-4">
              <RiDoubleQuotesL className="text-yellow-500 w-6 h-6" />
              <h3 className="font-semibold text-xl">
                Our Unpaid Software Intern
              </h3>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg break-all">
              LET ME OUTTTTTTTTT LETT ME
              OUTTTTZ9yDn5q9wnGx@A8ykz/UdtmaRsPhEJWm=Y%$p-n-&pGm6xdkN/q56ptL*c2c88^4mV.kQBB73Nnw@$z!w!x&^p5tKNjK.tBcN32q7QxYQ.8Hf=Fe6&6!+
              ”
            </p>
          </div>
        </div>
      </PageContainer>

      {/* FOOTER */}
      <div className="mt-32 mb-10 text-xs text-muted-foreground">
        UCLA Delivery Network — Built by Bruins 💙🐻💛
      </div>
    </div>
  );
}

export default Cover;
