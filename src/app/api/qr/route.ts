import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const targetUrl = searchParams.get("url") || `${protocol}://${host}`;
    const format = searchParams.get("format") || "svg";
    const download = searchParams.get("download") === "true";
    const filename = searchParams.get("filename") || "qr-trivia-fiesta.png";

    if (format === "png" || download) {
      const pngBuffer = await QRCode.toBuffer(targetUrl, {
        type: "png",
        width: 800,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });

      return new NextResponse(pngBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
          ...(download
            ? { "Content-Disposition": `attachment; filename="${filename}"` }
            : {}),
        },
      });
    }

    const svg = await QRCode.toString(targetUrl, {
      type: "svg",
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error generating QR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
