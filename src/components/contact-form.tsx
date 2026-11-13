"use client";

import { type FormEvent } from "react";

const PROJECT_TYPES = ["Product UI", "Website", "Visual identity", "Motion & launch video", "Interactive 3D", "Ongoing creative support", "Not sure yet"];
const TIMELINES = ["As soon as possible", "Within a month", "In 1–3 months", "Flexible"];
const BUDGETS = ["Under $1,500", "$1,500 – $3,000", "$3,000 – $6,000", "Above $6,000"];

export function ContactForm({ email }: { email: string }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
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

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-form-row">
        <label className="contact-field">
          <span>Name <i aria-hidden="true">*</i></span>
          <input autoComplete="name" name="name" placeholder="Your name" required type="text" />
        </label>
        <label className="contact-field">
          <span>Company or product</span>
          <input autoComplete="organization" name="company" placeholder="What you're building" type="text" />
        </label>
      </div>
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
        <button className="sidebar-cta" type="submit">Send brief</button>
        <p>Opens your email app with the brief ready to send.</p>
      </div>
    </form>
  );
}
