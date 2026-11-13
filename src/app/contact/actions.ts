"use server";

import { site } from "@/data/site";

export type BriefResult = { status: "sent" | "invalid" | "failed" | "not_configured" };

function clean(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function sendBrief(formData: FormData): Promise<BriefResult> {
  // Honeypot: real visitors never see or fill this field.
  if (clean(formData.get("website"), 200)) return { status: "sent" };

  const name = clean(formData.get("name"), 120);
  const email = clean(formData.get("email"), 200);
  const company = clean(formData.get("company"), 160);
  const projectType = clean(formData.get("projectType"), 80);
  const timeline = clean(formData.get("timeline"), 80);
  const budget = clean(formData.get("budget"), 80);
  const message = clean(formData.get("message"), 5000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "invalid" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { status: "not_configured" };

  const text = [
    message,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Company or product: ${company || "—"}`,
    `Project type: ${projectType || "—"}`,
    `Timeline: ${timeline || "—"}`,
    `Budget range: ${budget || "—"}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO_EMAIL || site.email],
        reply_to: email,
        subject: `New project brief — ${company || name}`,
        text,
      }),
    });
    return { status: response.ok ? "sent" : "failed" };
  } catch {
    return { status: "failed" };
  }
}
