import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
        /*
         * GRAPH DATA
         */

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

        /*
         * PHYSICS
         */

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

        /*
         * OBJECT BEING ANIMATED
         */

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

        /*
         * GENERAL PHYSICS
         */

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

        /*
         * RIVER
         */

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

        /*
         * INCLINE
         */

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

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const input = body?.input;

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

    const prompt = `You are Graphora's reasoning engine.

Convert the user's academic question into structured JSON for deterministic frontend renderers. Do not generate code.

USER QUESTION:
${input}

CLASSIFICATION:
- Explicit plot/graph/versus/against request -> type="graph".
- Motion/visualize/show something moving -> type="physics".
- Processes, mechanisms, structures, algorithms, biology, chemistry, networking -> diagram, flowchart, or scene as appropriate.

GRAPH RULES:
- Use x as the independent variable. For time-based graphs, x=time in seconds and normally xMin=0.
- Extract numerical values from the question.
- Velocity: v=u+a*x.
- Displacement: s=u*x+0.5*a*x^2.
- Constant acceleration: a.
- Projectile height: u*sin(theta)*x-0.5*g*x^2.
- Free-fall displacement: u*x+0.5*g*x^2.
- Free-fall velocity: u+g*x.
- Incline acceleration: g*sin(theta).
- Incline velocity: u+a*x.
- Incline displacement: u*x+0.5*a*x^2.
- Circular angular position: (speed/radius)*x.
- Normal mathematical graph such as y=x^2 -> equation="x^2", xMin=-10, xMax=10.

PHYSICS RULES:
- projectile -> motionType="projectile", subject="ball"
- circular motion -> motionType="circular"; subject car/person/ball/particle as appropriate
- walking -> motionType="walking", subject="person"
- accelerating -> motionType="accelerating"; subject car/ball/particle as appropriate
- free fall -> motionType="freefall", subject="ball" unless another object is specified
- river/current/boat crossing -> motionType="river_crossing", subject="boat"
- incline/ramp/slope/inclined plane -> motionType="inclined_plane", subject="block"; NEVER generic accelerating
- For a frictionless incline use a=g*sin(theta), with gravity=9.8 by default.
- For direct river crossing, angle=90.

OUTPUT RULES:
- Return ONLY valid JSON matching the supplied schema.
- No markdown, explanations outside JSON, React, HTML, SVG, JavaScript, or code fences.
- Extract all relevant numerical values. Do not invent unnecessary values. Use sensible defaults only when necessary.`

    const response =
      await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",

        contents: prompt,

        config: {
          responseMimeType:
            "application/json",

          responseSchema:
            visualSchema,
        },
      });

    const text =
      response.text;

    if (!text) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    const result =
      JSON.parse(text);

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