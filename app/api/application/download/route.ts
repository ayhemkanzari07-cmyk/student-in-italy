import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun } from "docx";

import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

type ApplicationPack = {
  coverLetter?: string;

  cv?: {
    title?: string;
    profile?: string;
    experience?: string;
    skills?: string;
    availability?: string;
    note?: string;
  };
};

function addSection(
  children: Paragraph[],
  title: string,
  content: string
) {
  children.push(
    new Paragraph({
      spacing: {
        before: 240,
        after: 120,
      },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 26,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        after: 160,
      },
      children: [
        new TextRun({
          text: content || "",
          size: 22,
        }),
      ],
    })
  );
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const applicationId =
      searchParams.get("applicationId");

    const type = searchParams.get("type");

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Application ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      type !== "cv" &&
      type !== "cover-letter"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid download type.",
        },
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * LOAD APPLICATION
     * ---------------------------------------------------------
     */

    const {
      data: application,
      error: applicationError,
    } = await supabase
      .from("applications")
      .select(
        "id, user_id, job_title, company, content, status, expires_at"
      )
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .single();

    if (
      applicationError ||
      !application
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found.",
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 48 HOUR EXPIRATION CHECK
     * ---------------------------------------------------------
     */

    const expired =
      application.status === "expired" ||
      (
        application.expires_at &&
        new Date(application.expires_at).getTime() <=
          Date.now()
      );

    if (expired) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This application pack has expired. Generated content is available for 48 hours only.",
        },
        { status: 410 }
      );
    }

    if (!application.content) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Application content is no longer available.",
        },
        { status: 410 }
      );
    }

    const pack =
      application.content as ApplicationPack;

    /*
     * ---------------------------------------------------------
     * CREATE DOCUMENT CONTENT
     * ---------------------------------------------------------
     */

    const children: Paragraph[] = [];

    /*
     * ---------------------------------------------------------
     * COVER LETTER
     * ---------------------------------------------------------
     */

    if (type === "cover-letter") {
      const coverLetter =
        pack.coverLetter?.trim();

      if (!coverLetter) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cover letter is not available.",
          },
          { status: 404 }
        );
      }

      children.push(
        new Paragraph({
          spacing: {
            after: 240,
          },
          children: [
            new TextRun({
              text: "LETTERA DI PRESENTAZIONE",
              bold: true,
              size: 32,
            }),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: {
            after: 240,
          },
          children: [
            new TextRun({
              text: `${application.job_title} — ${application.company}`,
              bold: true,
              size: 22,
            }),
          ],
        })
      );

      for (
        const paragraph of coverLetter.split(/\n+/)
      ) {
        if (paragraph.trim()) {
          children.push(
            new Paragraph({
              spacing: {
                after: 180,
              },
              children: [
                new TextRun({
                  text: paragraph.trim(),
                  size: 22,
                }),
              ],
            })
          );
        }
      }
    }

    /*
     * ---------------------------------------------------------
     * CV
     * ---------------------------------------------------------
     */

    if (type === "cv") {
      const cv = pack.cv;

      if (!cv) {
        return NextResponse.json(
          {
            success: false,
            error: "CV is not available.",
          },
          { status: 404 }
        );
      }

      /*
       * CV TITLE
       */

      children.push(
        new Paragraph({
          spacing: {
            after: 120,
          },
          children: [
            new TextRun({
              text:
                cv.title ||
                "Curriculum Vitae",
              bold: true,
              size: 36,
            }),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: {
            after: 300,
          },
          children: [
            new TextRun({
              text: "StudentInItaly",
              size: 18,
            }),
          ],
        })
      );

      /*
       * PROFILE
       */

      if (cv.profile) {
        addSection(
          children,
          "Profilo professionale",
          cv.profile
        );
      }

      /*
       * EXPERIENCE
       */

      if (cv.experience) {
        addSection(
          children,
          "Esperienza",
          cv.experience
        );
      }

      /*
       * SKILLS
       */

      if (cv.skills) {
        addSection(
          children,
          "Competenze",
          cv.skills
        );
      }

      /*
       * AVAILABILITY
       */

      if (cv.availability) {
        addSection(
          children,
          "Disponibilità",
          cv.availability
        );
      }

      /*
       * NOTE
       */

      if (cv.note) {
        addSection(
          children,
          "Note",
          cv.note
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * CREATE DOCX
     * ---------------------------------------------------------
     */

    const document = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const buffer =
      await Packer.toBuffer(document);

    /*
     * Convert Node Buffer to a standard
     * ArrayBuffer accepted by NextResponse.
     */

    const body =
      Uint8Array.from(buffer).buffer;

    const fileName =
      type === "cv"
        ? "StudentInItaly-CV.docx"
        : "StudentInItaly-Cover-Letter.docx";

    /*
     * ---------------------------------------------------------
     * DOWNLOAD RESPONSE
     * ---------------------------------------------------------
     */

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        "Content-Disposition":
          `attachment; filename="${fileName}"`,

        "Cache-Control":
          "private, no-store",
      },
    });
  } catch (error) {
    console.error(
      "APPLICATION DOWNLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not generate the document.",
      },
      { status: 500 }
    );
  }
}