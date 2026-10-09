"use client";

import { useState, useRef } from "react";

import {
  motion,
  useAnimationFrame,
} from "framer-motion";

import {
  ArrowRight,
  Sparkles,
  UserRound,
  Car,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Result = {
  type: string;
  title: string;
  explanation: string;
  data: any;
};

/* =========================================================
   REAL-TIME SIMULATION CLOCK
========================================================= */

function useSimulationClock(
  duration: number,
  resetKey: string
) {
  const [elapsed, setElapsed] =
    useState(0);

  const elapsedRef =
    useRef(0);

  const lastResetKey =
    useRef(resetKey);

  const lastRenderTime =
    useRef(0);

  useAnimationFrame(
    (_, delta) => {
      if (
        lastResetKey.current !==
        resetKey
      ) {
        lastResetKey.current =
          resetKey;

        elapsedRef.current = 0;
        lastRenderTime.current = 0;

        setElapsed(0);

        return;
      }

      if (duration <= 0) {
        return;
      }

      elapsedRef.current +=
        delta / 1000;

      if (
        elapsedRef.current >=
        duration
      ) {
        elapsedRef.current = 0;
      }

      if (
        elapsedRef.current -
          lastRenderTime.current >=
        1 / 30
      ) {
        lastRenderTime.current =
          elapsedRef.current;

        setElapsed(
          elapsedRef.current
        );
      }
    }
  );

  return elapsed;
}

/* =========================================================
   STAT
========================================================= */

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   EQUATION EVALUATOR
========================================================= */

function evaluateEquation(
  equation: string,
  x: number
): number {
  try {
    let expression =
      equation
        .replace(/\^/g, "**")
        .replace(/\bpi\b/gi, "Math.PI")
        .replace(/\bsqrt\b/gi, "Math.sqrt")
        .replace(/\babs\b/gi, "Math.abs")
        .replace(/\bexp\b/gi, "Math.exp")
        .replace(/\bsin\b/gi, "Math.sin")
        .replace(/\bcos\b/gi, "Math.cos")
        .replace(/\btan\b/gi, "Math.tan")
        .replace(
          /\bx\b/g,
          `(${x})`
        );

    expression =
      expression
        .replace(
          /Math\.sin\(([^()]+)\)/g,
          (_, value) =>
            `Math.sin((${value}) * Math.PI / 180)`
        )
        .replace(
          /Math\.cos\(([^()]+)\)/g,
          (_, value) =>
            `Math.cos((${value}) * Math.PI / 180)`
        )
        .replace(
          /Math\.tan\(([^()]+)\)/g,
          (_, value) =>
            `Math.tan((${value}) * Math.PI / 180)`
        );

    const result =
      Function(
        `"use strict"; return (${expression})`
      )();

    if (
      typeof result !==
        "number" ||
      !Number.isFinite(result)
    ) {
      return 0;
    }

    return result;
  } catch {
    return 0;
  }
}

/* =========================================================
   GRAPH
========================================================= */

function GraphRenderer({
  data,
}: {
  data: any;
}) {
  const xMin =
    data.xMin ?? 0;

  const xMax =
    data.xMax ?? 10;

  const equation =
    data.equation ||
    "x^2";

  const points =
    Array.from(
      {
        length: 201,
      },
      (_, i) => {
        const x =
          xMin +
          ((xMax - xMin) * i) /
            200;

        return {
          x: Number(
            x.toFixed(4)
          ),

          y: Number(
            evaluateEquation(
              equation,
              x
            ).toFixed(4)
          ),
        };
      }
    );

  return (
    <div className="space-y-4">

      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">

        <div className="mb-4 flex items-center justify-between">

          <div>
            <p className="text-sm text-slate-400">
              Equation
            </p>

            <p className="font-mono text-lg text-blue-400">
              y = {equation}
            </p>
          </div>

          <div className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
            Graph
          </div>

        </div>

        <div className="h-[450px] w-full">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={points}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
              />

              <XAxis
                dataKey="x"
                type="number"
                domain={[
                  xMin,
                  xMax,
                ]}
                stroke="#94a3b8"
                label={{
                  value:
                    data.xLabel ||
                    "x",
                  position:
                    "insideBottom",
                  offset: -5,
                  fill: "#94a3b8",
                }}
              />

              <YAxis
                stroke="#94a3b8"
                label={{
                  value:
                    data.yLabel ||
                    "y",
                  angle: -90,
                  position:
                    "insideLeft",
                  fill: "#94a3b8",
                }}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="y"
                stroke="#60a5fa"
                strokeWidth={3}
                dot={false}
                isAnimationActive={
                  false
                }
              />

            </LineChart>
          </ResponsiveContainer>

        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <Stat
          label="X range"
          value={`${xMin} → ${xMax}`}
        />

        <Stat
          label="Function"
          value={`y = ${equation}`}
        />

      </div>

    </div>
  );
}

/* =========================================================
   PROJECTILE
========================================================= */

function Projectile({
  data,
}: {
  data: any;
}) {
  const velocity =
    data.initialVelocity ?? 20;

  const angle =
    data.launchAngle ?? 45;

  const gravity =
    data.gravity ?? 9.8;

  const radians =
    (angle * Math.PI) / 180;

  const vx =
    velocity *
    Math.cos(radians);

  const vy =
    velocity *
    Math.sin(radians);

  const flightTime =
    data.duration ??
    Math.max(
      0.1,
      (2 * vy) /
        gravity
    );

  const elapsed =
    useSimulationClock(
      flightTime,
      `${velocity}-${angle}-${gravity}`
    );

  const x =
    vx * elapsed;

  const y =
    vy * elapsed -
    0.5 *
      gravity *
      elapsed *
      elapsed;

  const verticalVelocity =
    vy -
    gravity *
      elapsed;

  const currentVelocity =
    Math.sqrt(
      vx * vx +
        verticalVelocity *
          verticalVelocity
    );

  const range =
    vx * flightTime;

  const maxHeight =
    (vy * vy) /
    (2 * gravity);

  const scaleX =
    650 /
    Math.max(
      range,
      1
    );

  const scaleY =
    280 /
    Math.max(
      maxHeight,
      1
    );

  const visualX =
    60 +
    x * scaleX;

  const visualY =
    350 -
    Math.max(
      0,
      y
    ) * scaleY;

  return (
    <div className="space-y-6">

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-4">

        <svg
          viewBox="0 0 800 400"
          className="w-full"
        >

          <line
            x1="30"
            y1="350"
            x2="770"
            y2="350"
            stroke="#475569"
            strokeWidth="2"
          />

          <g
            transform={`translate(${visualX} ${visualY})`}
          >
            <circle
              cx="0"
              cy="0"
              r="11"
              fill="white"
            />
          </g>

          <text
            x="50"
            y="40"
            fill="#94a3b8"
            fontSize="16"
          >
            Projectile motion
          </text>

        </svg>

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <Stat
          label="Time"
          value={`${elapsed.toFixed(
            2
          )} s`}
        />

        <Stat
          label="Position"
          value={`${x.toFixed(
            2
          )} m, ${Math.max(
            0,
            y
          ).toFixed(2)} m`}
        />

        <Stat
          label="Velocity"
          value={`${currentVelocity.toFixed(
            2
          )} m/s`}
        />

        <Stat
          label="Flight time"
          value={`${flightTime.toFixed(
            2
          )} s`}
        />

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <Stat
          label="Range"
          value={`${range.toFixed(
            2
          )} m`}
        />

        <Stat
          label="Maximum height"
          value={`${maxHeight.toFixed(
            2
          )} m`}
        />

      </div>

    </div>
  );
}

/* =========================================================
   CIRCULAR MOTION
========================================================= */

function Circular({
  data,
}: {
  data: any;
}) {
  const radius =
    data.radius ?? 10;

  const speed =
    data.speed ?? 5;

  const subject =
    data.subject ||
    "particle";

  const period =
    (2 * Math.PI * radius) /
    speed;

  const elapsed =
    useSimulationClock(
      period,
      `${radius}-${speed}-${subject}`
    );

  const angularVelocity =
    speed / radius;

  const theta =
    angularVelocity *
    elapsed;

  const physicsX =
    radius *
    Math.cos(theta);

  const physicsY =
    radius *
    Math.sin(theta);

  const visualRadius =
    140;

  const visualX =
    400 +
    visualRadius *
      Math.cos(theta);

  const visualY =
    220 +
    visualRadius *
      Math.sin(theta);

  const centripetalAcceleration =
    (speed * speed) /
    radius;

  const renderSubject =
    () => {
      if (
        subject ===
        "car"
      ) {
        return (
          <g
            transform={`translate(${visualX} ${visualY}) rotate(${
              (theta * 180) /
              Math.PI +
              90
            })`}
          >

            <rect
              x="-24"
              y="-12"
              width="48"
              height="24"
              rx="5"
              fill="white"
            />

            <path
              d="M -15 -12 L -8 -22 L 10 -22 L 18 -12 Z"
              fill="white"
            />

            <circle
              cx="-14"
              cy="12"
              r="6"
              fill="#0f172a"
            />

            <circle
              cx="14"
              cy="12"
              r="6"
              fill="#0f172a"
            />

          </g>
        );
      }

      if (
        subject ===
        "ball"
      ) {
        return (
          <circle
            cx={visualX}
            cy={visualY}
            r="11"
            fill="white"
          />
        );
      }

      if (
        subject ===
        "person"
      ) {
        return (
          <g
            transform={`translate(${visualX} ${visualY})`}
          >
            <circle
              cx="0"
              cy="-15"
              r="7"
              fill="white"
            />

            <line
              x1="0"
              y1="-8"
              x2="0"
              y2="12"
              stroke="white"
              strokeWidth="4"
            />

            <line
              x1="0"
              y1="-2"
              x2="-12"
              y2="8"
              stroke="white"
              strokeWidth="4"
            />

            <line
              x1="0"
              y1="-2"
              x2="12"
              y2="8"
              stroke="white"
              strokeWidth="4"
            />

          </g>
        );
      }

      return (
        <circle
          cx={visualX}
          cy={visualY}
          r="10"
          fill="white"
        />
      );
    };

  return (
    <div className="space-y-6">

      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">

        <svg
          viewBox="0 0 800 450"
          className="w-full"
        >

          <circle
            cx="400"
            cy="220"
            r={visualRadius}
            fill="none"
            stroke="#475569"
            strokeWidth="3"
          />

          <circle
            cx="400"
            cy="220"
            r="5"
            fill="white"
          />

          <line
            x1="400"
            y1="220"
            x2={visualX}
            y2={visualY}
            stroke="#60a5fa"
            strokeWidth="2"
            strokeDasharray="6 6"
          />

          {renderSubject()}

          <text
            x="50"
            y="40"
            fill="#94a3b8"
            fontSize="16"
          >
            Circular motion
          </text>

        </svg>

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <Stat
          label="Time"
          value={`${elapsed.toFixed(
            2
          )} s`}
        />

        <Stat
          label="Speed"
          value={`${speed} m/s`}
        />

        <Stat
          label="Angular velocity"
          value={`${angularVelocity.toFixed(
            2
          )} rad/s`}
        />

        <Stat
          label="Period"
          value={`${period.toFixed(
            2
          )} s`}
        />

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <Stat
          label="X position"
          value={`${physicsX.toFixed(
            2
          )} m`}
        />

        <Stat
          label="Y position"
          value={`${physicsY.toFixed(
            2
          )} m`}
        />

        <Stat
          label="Centripetal acceleration"
          value={`${centripetalAcceleration.toFixed(
            2
          )} m/s²`}
        />

      </div>

    </div>
  );
}

/* =========================================================
   WALKING
========================================================= */

function Walking({
  data,
}: {
  data: any;
}) {
  const speed =
    data.speed ?? 1.5;

  const distance =
    data.distance ?? 100;

  const duration =
    data.duration ??
    distance / speed;

  const elapsed =
    useSimulationClock(
      duration,
      `${speed}-${distance}`
    );

  const travelled =
    Math.min(
      distance,
      speed * elapsed
    );

  const progress =
    distance > 0
      ? travelled / distance
      : 0;

  const trackWidth =
    700;

  const personX =
    progress *
    trackWidth;

  return (
    <div className="space-y-6">

      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-8">

        <div
          className="relative mx-auto h-32"
          style={{
            width: `${trackWidth}px`,
            maxWidth: "100%",
          }}
        >

          <div className="absolute left-0 right-0 top-20 h-1 bg-slate-700" />

          <div
            className="absolute top-8"
            style={{
              left: `${personX}px`,
              transform:
                "translateX(-50%)",
            }}
          >
            <UserRound
              size={48}
              strokeWidth={1.8}
            />
          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <Stat
          label="Time"
          value={`${elapsed.toFixed(
            2
          )} s`}
        />

        <Stat
          label="Speed"
          value={`${speed} m/s`}
        />

        <Stat
          label="Distance travelled"
          value={`${travelled.toFixed(
            2
          )} m`}
        />

        <Stat
          label="Total time"
          value={`${duration.toFixed(
            2
          )} s`}
        />

      </div>

    </div>
  );
}

/* =========================================================
   ACCELERATION
========================================================= */

function Accelerating({
  data,
}: {
  data: any;
}) {
  const initialVelocity =
    data.initialVelocity ?? 5;

  const acceleration =
    data.acceleration ?? 2;

  const duration =
    data.duration ?? 5;

  const subject =
    data.subject ||
    "car";

  const elapsed =
    useSimulationClock(
      duration,
      `${initialVelocity}-${acceleration}-${duration}-${subject}`
    );

  const currentVelocity =
    initialVelocity +
    acceleration *
      elapsed;

  const distance =
    initialVelocity *
      elapsed +
    0.5 *
      acceleration *
      elapsed *
      elapsed;

  const totalDistance =
    initialVelocity *
      duration +
    0.5 *
      acceleration *
      duration *
      duration;

  const finalVelocity =
    initialVelocity +
    acceleration *
      duration;

  const progress =
    totalDistance !== 0
      ? Math.min(
          1,
          Math.max(
            0,
            distance /
              totalDistance
          )
        )
      : 0;

  return (
    <div className="space-y-6">

      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-8">

        <div className="relative h-32 overflow-hidden">

          <div className="absolute left-0 right-0 top-20 h-1 bg-slate-700" />

          <div
            className="absolute top-8"
            style={{
              left: `${progress * 100}%`,
              transform:
                "translateX(-50%)",
            }}
          >

            <Car
              size={56}
              strokeWidth={1.8}
            />

          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <Stat
          label="Time"
          value={`${elapsed.toFixed(
            2
          )} s`}
        />

        <Stat
          label="Velocity"
          value={`${currentVelocity.toFixed(
            2
          )} m/s`}
        />

        <Stat
          label="Distance"
          value={`${distance.toFixed(
            2
          )} m`}
        />

        <Stat
          label="Acceleration"
          value={`${acceleration} m/s²`}
        />

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <Stat
          label="Final velocity"
          value={`${finalVelocity.toFixed(
            2
          )} m/s`}
        />

        <Stat
          label="Total distance"
          value={`${totalDistance.toFixed(
            2
          )} m`}
        />

      </div>

    </div>
  );
}

/* =========================================================
   FREE FALL
========================================================= */

function Freefall({
  data,
}: {
  data: any;
}) {
  const gravity =
    data.gravity ?? 9.8;

  const initialVelocity =
    data.initialVelocity ?? 0;

  const duration =
    data.duration ?? 3;

  const elapsed =
    useSimulationClock(
      duration,
      `${gravity}-${initialVelocity}-${duration}`
    );

  const distance =
    initialVelocity *
      elapsed +
    0.5 *
      gravity *
      elapsed *
      elapsed;

  const velocity =
    initialVelocity +
    gravity *
      elapsed;

  const finalDistance =
    initialVelocity *
      duration +
    0.5 *
      gravity *
      duration *
      duration;

  const finalVelocity =
    initialVelocity +
    gravity *
      duration;

  const progress =
    finalDistance > 0
      ? Math.min(
          1,
          distance /
            finalDistance
        )
      : 0;

  return (
    <div className="space-y-6">

      <div className="relative flex h-[400px] justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">

        <div className="absolute top-8 bottom-8 w-1 bg-slate-800" />

        <div
          className="absolute h-6 w-6 rounded-full bg-white"
          style={{
            top: `${
              40 +
              progress *
                300
            }px`,
          }}
        />

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <Stat
          label="Time"
          value={`${elapsed.toFixed(
            2
          )} s`}
        />

        <Stat
          label="Velocity"
          value={`${velocity.toFixed(
            2
          )} m/s`}
        />

        <Stat
          label="Distance fallen"
          value={`${distance.toFixed(
            2
          )} m`}
        />

        <Stat
          label="Acceleration"
          value={`${gravity} m/s²`}
        />

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <Stat
          label="Final velocity"
          value={`${finalVelocity.toFixed(
            2
          )} m/s`}
        />

        <Stat
          label="Total distance"
          value={`${finalDistance.toFixed(
            2
          )} m`}
        />

      </div>

    </div>
  );
}

/* =========================================================
   RIVER CROSSING
========================================================= */

function RiverCrossing({
  data,
}: {
  data: any;
}) {
  const boatSpeed =
    data.boatSpeed ?? 5;

  const riverSpeed =
    data.riverSpeed ?? 3;

  const riverWidth =
    data.riverWidth ?? 100;

  const crossingTime =
    riverWidth /
    boatSpeed;

  const downstreamDistance =
    riverSpeed *
    crossingTime;

  const elapsed =
    useSimulationClock(
      crossingTime,
      `${boatSpeed}-${riverSpeed}-${riverWidth}`
    );

  const currentY =
    Math.min(
      riverWidth,
      boatSpeed * elapsed
    );

  const currentX =
    riverSpeed * elapsed;

  const progress =
    crossingTime > 0
      ? elapsed /
        crossingTime
      : 0;

  const visualStartX =
    120;

  const visualStartY =
    90;

  const visualRiverHeight =
    300;

  const scaleY =
    visualRiverHeight /
    riverWidth;

  const scaleX =
    600 /
    Math.max(
      downstreamDistance,
      1
    );

  const boatX =
    visualStartX +
    currentX * scaleX;

  const boatY =
    visualStartY +
    currentY * scaleY;

  return (
    <div className="space-y-6">

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-4">

        <svg
          viewBox="0 0 800 500"
          className="w-full"
        >

          <rect
            x="0"
            y="60"
            width="800"
            height="360"
            fill="#082f49"
          />

          <rect
            x="0"
            y="30"
            width="800"
            height="30"
            fill="#365314"
          />

          <rect
            x="0"
            y="420"
            width="800"
            height="30"
            fill="#365314"
          />

          {Array.from({
            length: 6,
          }).map((_, row) =>
            Array.from({
              length: 9,
            }).map(
              (_, col) => (
                <path
                  key={`${row}-${col}`}
                  d={`M ${
                    col * 100
                  } ${
                    95 +
                    row * 55
                  } q 15 -8 30 0 q 15 8 30 0`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  opacity="0.4"
                />
              )
            )
          )}

          <line
            x1={visualStartX}
            y1={visualStartY}
            x2={
              visualStartX +
              downstreamDistance *
                scaleX
            }
            y2={
              visualStartY +
              riverWidth *
                scaleY
            }
            stroke="#facc15"
            strokeWidth="3"
            strokeDasharray="8 8"
          />

          <g
            transform={`translate(${boatX} ${boatY})`}
          >

            <path
              d="M -30 0 L 30 0 L 18 18 L -18 18 Z"
              fill="#f97316"
            />

            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-28"
              stroke="white"
              strokeWidth="3"
            />

            <path
              d="M 2 -27 L 24 -8 L 2 -5 Z"
              fill="white"
            />

          </g>

          <text
            x="550"
            y="85"
            fill="white"
            fontSize="15"
          >
            Current →
          </text>

        </svg>

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <Stat
          label="Time"
          value={`${elapsed.toFixed(
            2
          )} s`}
        />

        <Stat
          label="Boat speed"
          value={`${boatSpeed} m/s`}
        />

        <Stat
          label="River speed"
          value={`${riverSpeed} m/s`}
        />

        <Stat
          label="Cross-river position"
          value={`${currentY.toFixed(
            2
          )} m`}
        />

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <Stat
          label="Downstream position"
          value={`${currentX.toFixed(
            2
          )} m`}
        />

        <Stat
          label="Landing displacement"
          value={`${downstreamDistance.toFixed(
            2
          )} m`}
        />

        <Stat
          label="Progress"
          value={`${(
            progress * 100
          ).toFixed(0)}%`}
        />

      </div>

    </div>
  );
}

/* =========================================================
   INCLINED PLANE
========================================================= */

function InclinedPlane({
  data,
}: {
  data: any;
}) {
  const angle =
    data.inclineAngle ?? 30;

  const distance =
    data.inclineDistance ?? 10;

  const gravity =
    data.gravity ?? 9.8;

  const initialVelocity =
    data.initialVelocity ?? 0;

  const radians =
    (angle * Math.PI) / 180;

  const acceleration =
    gravity *
    Math.sin(radians);

  const finalVelocity =
    Math.sqrt(
      Math.max(
        0,
        initialVelocity *
            initialVelocity +
          2 *
            acceleration *
            distance
      )
    );

  const time =
    acceleration > 0
      ? (finalVelocity -
          initialVelocity) /
        acceleration
      : 0;

  const elapsed =
    useSimulationClock(
      time,
      `${angle}-${distance}-${gravity}-${initialVelocity}`
    );

  const travelled =
    Math.min(
      distance,
      initialVelocity *
        elapsed +
        0.5 *
          acceleration *
          elapsed *
          elapsed
    );

  const velocity =
    Math.min(
      finalVelocity,
      initialVelocity +
        acceleration *
          elapsed
    );

  const progress =
    distance > 0
      ? travelled / distance
      : 0;

  const rampStartX =
    120;

  const rampStartY =
    350;

  const rampLength =
    560;

  const rampEndX =
    rampStartX +
    rampLength *
      Math.cos(radians);

  const rampEndY =
    rampStartY -
    rampLength *
      Math.sin(radians);

  const blockX =
    rampEndX -
    progress *
      (rampEndX -
        rampStartX);

  const blockY =
    rampEndY -
    progress *
      (rampEndY -
        rampStartY);

  return (
    <div className="space-y-6">

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-6">

        <svg
          viewBox="0 0 800 450"
          className="w-full"
        >

          <line
            x1="50"
            y1="380"
            x2="750"
            y2="380"
            stroke="#334155"
            strokeWidth="4"
          />

          <line
            x1={rampStartX}
            y1={rampStartY}
            x2={rampEndX}
            y2={rampEndY}
            stroke="#94a3b8"
            strokeWidth="14"
            strokeLinecap="round"
          />

          <line
            x1={rampStartX}
            y1={rampStartY}
            x2={rampEndX}
            y2={rampEndY}
            stroke="#475569"
            strokeWidth="6"
            strokeLinecap="round"
          />

          <text
            x={rampStartX + 90}
            y={rampStartY - 25}
            fill="#60a5fa"
            fontSize="18"
          >
            θ = {angle}°
          </text>

          <text
            x="320"
            y="245"
            fill="#4ade80"
            fontSize="16"
          >
            a ={" "}
            {acceleration.toFixed(
              2
            )}{" "}
            m/s²
          </text>

          <text
            x="350"
            y="350"
            fill="white"
            fontSize="16"
          >
            Distance ={" "}
            {distance} m
          </text>

          <g
            transform={`
              translate(
                ${blockX}
                ${blockY}
              )
              rotate(-${angle})
            `}
          >

            <rect
              x="-21"
              y="-21"
              width="42"
              height="42"
              rx="6"
              fill="#f97316"
            />

            <text
              x="-8"
              y="6"
              fill="white"
              fontSize="17"
              fontWeight="bold"
            >
              m
            </text>

          </g>

        </svg>

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <Stat
          label="Time"
          value={`${elapsed.toFixed(
            2
          )} s`}
        />

        <Stat
          label="Position"
          value={`${travelled.toFixed(
            2
          )} m`}
        />

        <Stat
          label="Velocity"
          value={`${velocity.toFixed(
            2
          )} m/s`}
        />

        <Stat
          label="Acceleration"
          value={`${acceleration.toFixed(
            2
          )} m/s²`}
        />

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <Stat
          label="Total distance"
          value={`${distance} m`}
        />

        <Stat
          label="Final velocity"
          value={`${finalVelocity.toFixed(
            2
          )} m/s`}
        />

        <Stat
          label="Total time"
          value={`${time.toFixed(
            2
          )} s`}
        />

      </div>

    </div>
  );
}

/* =========================================================
   PHYSICS ROUTER
========================================================= */

function PhysicsRenderer({
  data,
}: {
  data: any;
}) {
  switch (
    data.motionType
  ) {
    case "projectile":
      return (
        <Projectile
          data={data}
        />
      );

    case "circular":
      return (
        <Circular
          data={data}
        />
      );

    case "walking":
      return (
        <Walking
          data={data}
        />
      );

    case "accelerating":
      return (
        <Accelerating
          data={data}
        />
      );

    case "freefall":
      return (
        <Freefall
          data={data}
        />
      );

    case "river_crossing":
      return (
        <RiverCrossing
          data={data}
        />
      );

    case "inclined_plane":
      return (
        <InclinedPlane
          data={data}
        />
      );

    default:
      return (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          Unsupported physics
          visualization.
        </div>
      );
  }
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Home() {
  const [input, setInput] =
    useState("");

  const [result, setResult] =
    useState<Result | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const generate =
    async () => {
      if (!input.trim()) {
        return;
      }

      setLoading(true);
      setError("");
      setResult(null);

      try {
        const response =
          await fetch(
            "/api/generate",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                input,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to generate visualization"
          );
        }

        setResult(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

  const examples = [
    "A car moves around a circular track with radius 10 meters at 5 m/s",

    "A ball is thrown at 20 m/s at 45 degrees",

    "A person walks 100 meters at 1.5 m/s",

    "A car accelerates from 5 m/s at 2 m/s² for 5 seconds",

    "A ball falls freely for 3 seconds",

    "Plot y = x²",

    "Plot velocity against time for a car starting at 5 m/s and accelerating at 2 m/s² for 5 seconds",

    "Plot the height of a projectile launched at 20 m/s at 45 degrees",

    "Plot displacement against time for an object starting at 5 m/s with acceleration 2 m/s²",

    "A boat moves at 5 m/s relative to still water and crosses a 100 m wide river flowing at 3 m/s",

    "A block slides down a frictionless inclined plane at 30 degrees. It starts from rest and travels 10 meters.",
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* HEADER */}

        <header className="mb-10">

          <div className="mb-3 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">

              <Sparkles
                size={22}
                className="text-blue-400"
              />

            </div>

            <h1 className="text-3xl font-bold">
              Graphora
            </h1>

          </div>

          <p className="max-w-2xl text-slate-400">
            Turn academic questions
            into interactive visual
            explanations.
          </p>

        </header>

        {/* INPUT */}

        <section className="mb-10">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

            <textarea
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key ===
                    "Enter" &&
                  (e.ctrlKey ||
                    e.metaKey)
                ) {
                  generate();
                }
              }}
              placeholder="Ask Graphora a question..."
              className="min-h-[140px] w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 text-white outline-none transition focus:border-blue-500"
            />

            <div className="mt-4 flex justify-end">

              <button
                onClick={generate}
                disabled={
                  loading ||
                  !input.trim()
                }
                className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 font-semibold transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading
                  ? "Generating..."
                  : "Generate"}

                {!loading && (
                  <ArrowRight
                    size={18}
                  />
                )}

              </button>

            </div>

          </div>

          {/* EXAMPLES */}

          <div className="mt-4 flex flex-wrap gap-2">

            {examples.map(
              (example) => (
                <button
                  key={example}
                  onClick={() =>
                    setInput(
                      example
                    )
                  }
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-800"
                >
                  {example.length >
                  90
                    ? `${example.slice(
                        0,
                        90
                      )}...`
                    : example}
                </button>
              )
            )}

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* RESULT */}

        {result && (
          <motion.section
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="space-y-6"
          >

            <div>

              <div className="mb-2 flex items-center gap-2">

                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-400">
                  {result.type}
                </span>

              </div>

              <h2 className="text-2xl font-bold">
                {result.title}
              </h2>

              <p className="mt-2 max-w-3xl text-slate-400">
                {result.explanation}
              </p>

            </div>

            {result.type ===
              "graph" && (
              <GraphRenderer
                data={
                  result.data
                }
              />
            )}

            {result.type ===
              "physics" && (
              <PhysicsRenderer
                data={
                  result.data
                }
              />
            )}

            {(result.type ===
              "flowchart" ||
              result.type ===
                "diagram" ||
              result.type ===
                "scene") && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center text-slate-400">
                This visualization
                type is recognized,
                but its renderer
                is not implemented
                yet.
              </div>
            )}

          </motion.section>
        )}

      </div>

    </main>
  );
}