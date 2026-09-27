"use client";

import { FormEvent, useState } from "react";
import type { IContactPageSettings } from "@/lib/models/SiteSettings";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm({
  defaultSubject,
  productId,
  serviceId,
  content,
}: {
  defaultSubject?: string;
  productId?: string;
  serviceId?: string;
  content?: IContactPageSettings;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const nameLabel = content?.nameLabel || "Name";
  const emailFieldLabel = content?.emailFieldLabel || "Email";
  const phoneFieldLabel = content?.phoneFieldLabel || "Phone";
  const companyLabel = content?.companyLabel || "Company / Workshop";
  const inquiryTypeLabel = content?.inquiryTypeLabel || "Inquiry type";
  const subjectLabel = content?.subjectLabel || "Subject";
  const messageLabel = content?.messageLabel || "Message";
  const submitButtonText = content?.submitButtonText || "Send inquiry";
  const successMessage = content?.successMessage || "Message received. We will reply shortly.";
  const fallbackErrorMessage = content?.errorMessage || "Failed to send message. Please try again.";

  const inquiryOptions =
    Array.isArray(content?.inquiryOptions) && content.inquiryOptions.length > 0
      ? content.inquiryOptions
      : ["Product quote", "Parts sourcing", "Technical service", "Other"];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          product: productId,
          service: serviceId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || fallbackErrorMessage);
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : fallbackErrorMessage);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col space-y-1.5">
      {content?.formHeading && (
        <h2 className="text-base font-semibold text-navy mb-1">{content.formHeading}</h2>
      )}
      <div className="grid gap-1.5 sm:grid-cols-2">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-steel">
          {nameLabel}
          <input name="name" required className="field mt-0.5 !px-2.5 !py-1.5" />
        </label>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-steel">
          {emailFieldLabel}
          <input name="email" type="email" required className="field mt-0.5 !px-2.5 !py-1.5" />
        </label>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-steel">
          {phoneFieldLabel}
          <input name="phone" type="tel" className="field mt-0.5 !px-2.5 !py-1.5" />
        </label>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-steel">
          {companyLabel}
          <input name="company" className="field mt-0.5 !px-2.5 !py-1.5" />
        </label>
      </div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-steel">
        {inquiryTypeLabel}
        <select name="inquiryType" defaultValue={inquiryOptions[0]} className="field mt-0.5 !px-2.5 !py-1.5">
          {inquiryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-steel">
        {subjectLabel}
        <input
          name="subject"
          required
          defaultValue={defaultSubject}
          className="field mt-0.5 !px-2.5 !py-1.5"
        />
      </label>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-steel">
        {messageLabel}
        <textarea name="message" required rows={3} className="field mt-0.5 !px-2.5 !py-1.5" />
      </label>
      <button type="submit" disabled={status === "loading"} className="btn-orange mt-auto disabled:opacity-60">
        {status === "loading" ? "Sending…" : submitButtonText}
      </button>
      {status === "success" && (
        <p className="text-sm text-signal">{successMessage}</p>
      )}
      {status === "error" && <p className="text-sm text-orange">{error}</p>}
    </form>
  );
}
