"use client";

import { type FormEvent, useState } from "react";

import { sendBrief } from "@/app/contact/actions";

const PROJECT_TYPES = ["Product UI", "Website", "Visual identity", "Motion & launch video", "Interactive 3D", "Ongoing creative support", "Not sure yet"];
const TIMELINES = ["As soon as possible", "Within a month", "In 1–3 months", "Flexible"];
const BUDGETS = ["Under $1,500", "$1,500 – $3,000", "$3,000 – $6,000", "Above $6,000"];

export function ContactForm({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const openEmailDraft = (data: FormData) => {
    const value = (key: string) => String(data.get(key) ?? "").trim();
    const lines = [
      `Hi Hector,`,
      ``,
      value("message"),
      ``,
      `Name: ${value("name")}`,
      `Company or product: ${value("company") || "—"}`,
      `Project type: ${value("projectType") || "—"}`,
      `Timeline: ${value("timeline") || "—"}`,
      `Budget range: ${value("budget") || "—"}`,
    ];
    const subject = `New project — ${value("company") || value("name")}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState("sending");
    try {
      const result = await sendBrief(data);
      if (result.status === "sent") return setState("sent");
      if (result.status === "not_configured") {
        openEmailDraft(data);
        return setState("idle");
      }
      setState("failed");
    } catch {
      setState("failed");
    }
  };

  if (state === "sent") {
    return (
      <div className="contact-sent" role="status">
        <strong>Brief sent.</strong>
        <p>Thanks — I&apos;ll reply to your email within 1–2 business days.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-form-row">
        <label className="contact-field">
          <span>Name <i aria-hidden="true">*</i></span>
          <input autoComplete="name" name="name" placeholder="Your name" required type="text" />
        </label>
        <label className="contact-field">
          <span>Email <i aria-hidden="true">*</i></span>
          <input autoComplete="email" name="email" placeholder="you@company.com" required type="email" />
        </label>
      </div>
      <label className="contact-field">
        <span>Company or product</span>
        <input autoComplete="organization" name="company" placeholder="What you're building" type="text" />
      </label>
      <input aria-hidden="true" autoComplete="off" className="contact-honeypot" name="website" tabIndex={-1} type="text" />
      <div className="contact-form-row">
        <label className="contact-field">
          <span>Project type</span>
          <select defaultValue="" name="projectType">
            <option value="">Select…</option>
            {PROJECT_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="contact-field">
          <span>Timeline</span>
          <select defaultValue="" name="timeline">
            <option value="">Select…</option>
            {TIMELINES.map((timeline) => <option key={timeline}>{timeline}</option>)}
          </select>
        </label>
      </div>
      <fieldset className="contact-field">
        <legend>Budget range</legend>
        <div className="contact-choices">
          {BUDGETS.map((budget) => (
            <label className="contact-choice" key={budget}>
              <input name="budget" type="radio" value={budget} />
              <span>{budget}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="contact-field">
        <span>What do you need help with? <i aria-hidden="true">*</i></span>
        <textarea name="message" placeholder="Tell me what you're building, what needs to change, and what matters most…" required rows={4} />
      </label>
      <div className="contact-form-footer">
        <button className="sidebar-cta" disabled={state === "sending"} type="submit">{state === "sending" ? "Sending…" : "Send brief"}</button>
        {state === "failed" ? (
          <p role="alert">Couldn&apos;t send it. Please email <a href={`mailto:${email}`}>{email}</a> instead.</p>
        ) : (
          <p>I reply by email within 1–2 business days.</p>
        )}
      </div>
    </form>
  );
}
