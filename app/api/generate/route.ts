import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* =========================================================
   RESPONSE SCHEMA
========================================================= */

const visualSchema = {
  type: "object",

  properties: {
    type: {
      type: "string",
      enum: [
        "graph",
        "physics",
        "flowchart",
        "diagram",
        "scene",
      ],
    },

    title: {
      type: "string",
    },

    explanation: {
      type: "string",
    },

    data: {
      type: "object",

      properties: {
        /* GRAPH */

        equation: {
          type: "string",
        },

        xMin: {
          type: "number",
        },

        xMax: {
          type: "number",
        },

        yMin: {
          type: "number",
        },

        yMax: {
          type: "number",
        },

        xLabel: {
          type: "string",
        },

        yLabel: {
          type: "string",
        },

        /* PHYSICS */

        motionType: {
          type: "string",
          enum: [
            "projectile",
            "circular",
            "walking",
            "accelerating",
            "freefall",
            "river_crossing",
            "inclined_plane",
          ],
        },

        subject: {
          type: "string",
          enum: [
            "car",
            "person",
            "ball",
            "boat",
            "block",
            "particle",
          ],
        },

        initialVelocity: {
          type: "number",
        },

        launchAngle: {
          type: "number",
        },

        gravity: {
          type: "number",
        },

        radius: {
          type: "number",
        },

        speed: {
          type: "number",
        },

        distance: {
          type: "number",
        },

        duration: {
          type: "number",
        },

        acceleration: {
          type: "number",
        },

        /* RIVER */

        boatSpeed: {
          type: "number",
        },

        riverSpeed: {
          type: "number",
        },

        riverWidth: {
          type: "number",
        },

        angle: {
          type: "number",
        },

        /* INCLINE */

        inclineAngle: {
          type: "number",
        },

        inclineDistance: {
          type: "number",
        },
      },
    },
  },

  required: [
    "type",
    "title",
    "explanation",
    "data",
  ],
};

/* =========================================================
   SIMPLE CACHE
========================================================= */

const resultCache = new Map<
  string,
  Record<string, any>
>();

function normalizeInput(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/* =========================================================
   NUMBER HELPERS
========================================================= */

function firstNumber(
  text: string,
  patterns: RegExp[],
  fallback: number
) {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      const value = Number(match[1]);

      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  return fallback;
}

/* =========================================================
   LOCAL FAST PATH
========================================================= */

function getLocalVisualization(
  input: string
): Record<string, any> | null {
  const text = input.toLowerCase();

  /* -------------------------------------------------------
     y = x²
  ------------------------------------------------------- */

  if (
    /plot\s+y\s*=\s*x\s*(\^|²)\s*2?/.test(text) ||
    text.includes("plot y = x²") ||
    text.includes("plot y=x²")
  ) {
    return {
      type: "graph",

      title: "Graph of y = x²",

      explanation:
        "The graph shows the quadratic relationship y = x².",

      data: {
        equation: "x^2",
        xMin: -10,
        xMax: 10,
        xLabel: "x",
        yLabel: "y",
      },
    };
  }

  /* -------------------------------------------------------
     VELOCITY VS TIME
  ------------------------------------------------------- */

  if (
    text.includes("velocity against time") ||
    text.includes("velocity versus time") ||
    text.includes("velocity-time graph") ||
    text.includes("velocity time graph")
  ) {
    const initialVelocity =
      firstNumber(
        text,
        [
          /starting\s+at\s+([0-9.]+)\s*m\/s/,
          /starts?\s+at\s+([0-9.]+)\s*m\/s/,
          /initial(?:\s+velocity)?\s*(?:of|=)?\s*([0-9.]+)\s*m\/s/,
        ],
        0
      );

    const acceleration =
      firstNumber(
        text,
        [
          /accelerating\s+at\s+([0-9.]+)\s*m\/s/,
          /acceleration\s+(?:of|=)?\s*([0-9.]+)\s*m\/s/,
        ],
        2
      );

    const duration =
      firstNumber(
        text,
        [
          /for\s+([0-9.]+)\s*seconds?/,
          /over\s+([0-9.]+)\s*seconds?/,
        ],
        5
      );

    return {
      type: "graph",

      title: "Velocity vs Time",

      explanation:
        "Velocity increases linearly with time because the acceleration is constant.",

      data: {
        equation: `${initialVelocity} + ${acceleration}*x`,
        xMin: 0,
        xMax: duration,
        xLabel: "Time (s)",
        yLabel: "Velocity (m/s)",
      },
    };
  }

  /* -------------------------------------------------------
     DISPLACEMENT VS TIME
  ------------------------------------------------------- */

  if (
    text.includes("displacement against time") ||
    text.includes("displacement versus time") ||
    text.includes("displacement-time graph") ||
    text.includes("position against time")
  ) {
    const initialVelocity =
      firstNumber(
        text,
        [
          /starting\s+at\s+([0-9.]+)\s*m\/s/,
          /starts?\s+at\s+([0-9.]+)\s*m\/s/,
        ],
        0
      );

    const acceleration =
      firstNumber(
        text,
        [
          /acceleration\s*(?:of|=)?\s*([0-9.]+)\s*m\/s/,
          /accelerating\s+at\s+([0-9.]+)\s*m\/s/,
        ],
        2
      );

    const duration =
      firstNumber(
        text,
        [
          /for\s+([0-9.]+)\s*seconds?/,
          /over\s+([0-9.]+)\s*seconds?/,
        ],
        10
      );

    return {
      type: "graph",

      title: "Displacement vs Time",

      explanation:
        "Displacement follows a quadratic relationship with time under constant acceleration.",

      data: {
        equation: `${initialVelocity}*x + 0.5*${acceleration}*x^2`,
        xMin: 0,
        xMax: duration,
        xLabel: "Time (s)",
        yLabel: "Displacement (m)",
      },
    };
  }

  /* -------------------------------------------------------
     PROJECTILE GRAPH
  ------------------------------------------------------- */

  if (
    text.includes("plot the height of a projectile") ||
    text.includes("plot projectile height") ||
    text.includes("projectile height graph")
  ) {
    const velocity =
      firstNumber(
        text,
        [
          /launched\s+at\s+([0-9.]+)\s*m\/s/,
          /thrown\s+at\s+([0-9.]+)\s*m\/s/,
        ],
        20
      );

    const angle =
      firstNumber(
        text,
        [
          /at\s+([0-9.]+)\s*degrees?/,
          /angle\s+(?:of|=)?\s*([0-9.]+)\s*degrees?/,
        ],
        45
      );

    const gravity = 9.8;

    const radians =
      (angle * Math.PI) / 180;

    const flightTime =
      (2 * velocity * Math.sin(radians)) /
      gravity;

    return {
      type: "graph",

      title: "Projectile Height",

      explanation:
        "The graph shows the height of the projectile as a function of time.",

      data: {
        equation: `${velocity}*sin(${angle})*x - 0.5*${gravity}*x^2`,
        xMin: 0,
        xMax: flightTime,
        xLabel: "Time (s)",
        yLabel: "Height (m)",
      },
    };
  }

  /* -------------------------------------------------------
     PROJECTILE MOTION
  ------------------------------------------------------- */

  if (
    text.includes("projectile") ||
    text.includes("thrown") ||
    text.includes("launched")
  ) {
    const velocity =
      firstNumber(
        text,
        [
          /at\s+([0-9.]+)\s*m\/s/,
          /with\s+(?:an\s+)?initial\s+velocity\s+(?:of\s+)?([0-9.]+)\s*m\/s/,
        ],
        20
      );

    const angle =
      firstNumber(
        text,
        [
          /at\s+([0-9.]+)\s*degrees?/,
          /angle\s+(?:of|=)?\s*([0-9.]+)\s*degrees?/,
        ],
        45
      );

    return {
      type: "physics",

      title: "Projectile Motion",

      explanation:
        "The object follows a parabolic trajectory under gravity.",

      data: {
        motionType: "projectile",
        subject: "ball",
        initialVelocity: velocity,
        launchAngle: angle,
        gravity: 9.8,
      },
    };
  }

  /* -------------------------------------------------------
     RIVER CROSSING
  ------------------------------------------------------- */

  if (
    text.includes("river") ||
    text.includes("boat")
  ) {
    const boatSpeed =
      firstNumber(
        text,
        [
          /boat\s+(?:moves?|travels?|speed)\s+(?:at\s+)?([0-9.]+)\s*m\/s/,
          /([0-9.]+)\s*m\/s\s+relative\s+to\s+still\s+water/,
          /speed\s+(?:of\s+)?([0-9.]+)\s*m\/s\s+relative/,
        ],
        5
      );

    const riverWidth =
      firstNumber(
        text,
        [
          /([0-9.]+)\s*m\s+wide\s+river/,
          /river\s+(?:is\s+)?([0-9.]+)\s*m\s+wide/,
          /width\s+(?:of\s+)?([0-9.]+)\s*m/,
        ],
        100
      );

    const riverSpeed =
      firstNumber(
        text,
        [
          /river\s+flowing\s+at\s+([0-9.]+)\s*m\/s/,
          /current\s+(?:of\s+)?([0-9.]+)\s*m\/s/,
          /flow(?:s|ing)?\s+at\s+([0-9.]+)\s*m\/s/,
        ],
        3
      );

    const directAcross =
      text.includes("directly across") ||
      text.includes("perpendicular") ||
      text.includes("straight across");

    return {
      type: "physics",

      title: "River Crossing",

      explanation:
        "The boat moves across the river while the current carries it downstream.",

      data: {
        motionType: "river_crossing",
        subject: "boat",
        boatSpeed,
        riverSpeed,
        riverWidth,
        angle: directAcross ? 90 : 90,
      },
    };
  }

  /* -------------------------------------------------------
     CIRCULAR MOTION
  ------------------------------------------------------- */

  if (
    text.includes("circular track") ||
    text.includes("circular motion") ||
    text.includes("moves around a circle")
  ) {
    const radius =
      firstNumber(
        text,
        [
          /radius\s+([0-9.]+)\s*m/,
          /radius\s+of\s+([0-9.]+)\s*m/,
        ],
        10
      );

    const speed =
      firstNumber(
        text,
        [
          /at\s+([0-9.]+)\s*m\/s/,
          /speed\s+(?:of\s+)?([0-9.]+)\s*m\/s/,
        ],
        5
      );

    let subject:
      | "car"
      | "person"
      | "ball"
      | "particle" = "particle";

    if (text.includes("car")) {
      subject = "car";
    } else if (text.includes("person")) {
      subject = "person";
    } else if (text.includes("ball")) {
      subject = "ball";
    }

    return {
      type: "physics",

      title: "Circular Motion",

      explanation:
        "The object moves around a circular path with constant speed.",

      data: {
        motionType: "circular",
        subject,
        radius,
        speed,
      },
    };
  }

  /* -------------------------------------------------------
     WALKING
  ------------------------------------------------------- */

  if (
    text.includes("person walks") ||
    text.includes("person walking") ||
    text.includes("walks")
  ) {
    const distance =
      firstNumber(
        text,
        [
          /walks?\s+([0-9.]+)\s*m/,
          /([0-9.]+)\s*meters?/,
        ],
        100
      );

    const speed =
      firstNumber(
        text,
        [
          /at\s+([0-9.]+)\s*m\/s/,
          /speed\s+(?:of\s+)?([0-9.]+)\s*m\/s/,
        ],
        1.5
      );

    return {
      type: "physics",

      title: "Walking Motion",

      explanation:
        "The person moves at a constant speed along the path.",

      data: {
        motionType: "walking",
        subject: "person",
        distance,
        speed,
        duration: distance / speed,
      },
    };
  }

  /* -------------------------------------------------------
     FREE FALL
  ------------------------------------------------------- */

  if (
    text.includes("falls freely") ||
    text.includes("free fall") ||
    text.includes("freefall")
  ) {
    const duration =
      firstNumber(
        text,
        [
          /for\s+([0-9.]+)\s*seconds?/,
          /for\s+([0-9.]+)\s*s\b/,
        ],
        3
      );

    return {
      type: "physics",

      title: "Free Fall",

      explanation:
        "The object falls vertically under the influence of gravity.",

      data: {
        motionType: "freefall",
        subject: "ball",
        gravity: 9.8,
        duration,
        initialVelocity: 0,
      },
    };
  }

  /* -------------------------------------------------------
     INCLINED PLANE
  ------------------------------------------------------- */

  if (
    text.includes("inclined plane") ||
    text.includes("incline") ||
    text.includes("ramp") ||
    text.includes("slope")
  ) {
    const inclineAngle =
      firstNumber(
        text,
        [
          /at\s+([0-9.]+)\s*degrees?/,
          /angle\s+(?:of|=)?\s*([0-9.]+)\s*degrees?/,
        ],
        30
      );

    const inclineDistance =
      firstNumber(
        text,
        [
          /travels?\s+([0-9.]+)\s*meters?/,
          /travels?\s+([0-9.]+)\s*m\b/,
          /distance\s+(?:of\s+)?([0-9.]+)\s*m/,
        ],
        10
      );

    const initialVelocity =
      text.includes("starts from rest")
        ? 0
        : firstNumber(
            text,
            [
              /initial\s+velocity\s+(?:of|=)?\s*([0-9.]+)\s*m\/s/,
              /starts?\s+at\s+([0-9.]+)\s*m\/s/,
            ],
            0
          );

    return {
      type: "physics",

      title: "Inclined Plane",

      explanation:
        "The block accelerates down the frictionless incline due to the component of gravity along the slope.",

      data: {
        motionType: "inclined_plane",
        subject: "block",
        inclineAngle,
        inclineDistance,
        gravity: 9.8,
        initialVelocity,
      },
    };
  }

  /* -------------------------------------------------------
     ACCELERATION
  ------------------------------------------------------- */

  if (
    text.includes("accelerates") ||
    text.includes("accelerating")
  ) {
    const initialVelocity =
      firstNumber(
        text,
        [
          /from\s+([0-9.]+)\s*m\/s/,
          /starting\s+at\s+([0-9.]+)\s*m\/s/,
          /starts?\s+at\s+([0-9.]+)\s*m\/s/,
        ],
        5
      );

    const acceleration =
      firstNumber(
        text,
        [
          /at\s+([0-9.]+)\s*m\/s²/,
          /at\s+([0-9.]+)\s*m\/s2/,
          /acceleration\s+(?:of|=)?\s*([0-9.]+)\s*m\/s/,
        ],
        2
      );

    const duration =
      firstNumber(
        text,
        [
          /for\s+([0-9.]+)\s*seconds?/,
          /for\s+([0-9.]+)\s*s\b/,
        ],
        5
      );

    let subject:
      | "car"
      | "ball"
      | "particle" = "particle";

    if (text.includes("car")) {
      subject = "car";
    } else if (text.includes("ball")) {
      subject = "ball";
    }

    return {
      type: "physics",

      title: "Accelerated Motion",

      explanation:
        "The object moves with constant acceleration, so its velocity increases linearly with time.",

      data: {
        motionType: "accelerating",
        subject,
        initialVelocity,
        acceleration,
        duration,
      },
    };
  }

  return null;
}

/* =========================================================
   GEMINI PROMPT
========================================================= */

function buildPrompt(input: string) {
  return `
You are Graphora's reasoning engine.

Convert the user's academic question into ONE JSON object for deterministic frontend rendering.

USER QUESTION:
${input}

CLASSIFICATION:

GRAPH:
Use type="graph" when the user asks to plot or graph something.

Examples:
- Plot y = x^2
- Plot velocity against time
- Plot displacement against time
- Plot projectile height

For graphs:
- x is the independent variable.
- For time graphs, x is time in seconds.
- Use xMin=0 for time graphs unless negative time is requested.

Examples:
velocity = u + a*x
displacement = u*x + 0.5*a*x^2
acceleration = constant
projectile height = u*sin(theta)*x - 0.5*g*x^2

PHYSICS:
Use type="physics" for physical situations that should be animated.

motionType values:

projectile
circular
walking
accelerating
freefall
river_crossing
inclined_plane

Mapping:

projectile -> ball
circular -> car/person/ball/particle
walking -> person
accelerating -> car/ball/particle
freefall -> ball
river_crossing -> boat
inclined_plane -> block

IMPORTANT:
If the question mentions incline, ramp, slope, or inclined plane:
motionType MUST be "inclined_plane".

For river crossing:
motionType = "river_crossing"
subject = "boat"

For inclined plane:
motionType = "inclined_plane"
subject = "block"
gravity defaults to 9.8.

Extract numerical values from the user's question.

Do not invent unnecessary values.

Return ONLY valid JSON.
No markdown.
No code fences.
No comments.
No extra text.
` ;
}

/* =========================================================
   JSON CLEANUP
========================================================= */

function cleanJson(text: string) {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    cleaned = cleaned.slice(
      firstBrace,
      lastBrace + 1
    );
  }

  return cleaned;
}

/* =========================================================
   GEMINI
========================================================= */

async function generateWithGemini(
  input: string
) {
  const prompt =
    buildPrompt(input);

  const response =
    await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",

      contents: prompt,

      config: {
        responseMimeType:
          "application/json",

        responseSchema:
          visualSchema,

        temperature: 0,

        maxOutputTokens: 1200,
      },
    });

  const text =
    response.text;

  if (!text) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  const cleaned =
    cleanJson(text);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(
      "Invalid Gemini JSON:",
      cleaned.slice(0, 3000)
    );

    throw new Error(
      "Gemini returned invalid JSON. Please try again."
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const input =
      body?.input;

    if (
      typeof input !== "string" ||
      !input.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a question.",
        },
        {
          status: 400,
        }
      );
    }

    const normalized =
      normalizeInput(input);

    /* -------------------------------------------------------
       CACHE
    ------------------------------------------------------- */

    const cached =
      resultCache.get(normalized);

    if (cached) {
      console.log(
        "Graphora: cache hit"
      );

      return NextResponse.json(
        cached
      );
    }

    /* -------------------------------------------------------
       LOCAL FAST PATH
    ------------------------------------------------------- */

    const localResult =
      getLocalVisualization(
        input
      );

    if (localResult) {
      console.log(
        "Graphora: local fast path"
      );

      resultCache.set(
        normalized,
        localResult
      );

      return NextResponse.json(
        localResult
      );
    }

    /* -------------------------------------------------------
       GEMINI
    ------------------------------------------------------- */

    console.log(
      "Graphora: Gemini request"
    );

    const result =
      await generateWithGemini(
        input.trim()
      );

    resultCache.set(
      normalized,
      result
    );

    console.log(
      "Graphora result:",
      result
    );

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
      "Graphora generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate visualization.",
      },
      {
        status: 500,
      }
    );
  }
}