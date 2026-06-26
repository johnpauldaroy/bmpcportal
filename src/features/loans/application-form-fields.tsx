"use client";

import { Camera, Upload } from "lucide-react";
import { type ChangeEvent, type ReactNode } from "react";
import type { Option } from "./application-options";

const fieldLabel = "grid gap-2 text-sm font-semibold text-[#344456]";
const control =
  "min-h-10 rounded-md border border-[#cbd7e3] bg-white px-3 text-sm text-[#17263a]";

export function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((step, index) => {
        const state =
          index === current ? "current" : index < current ? "done" : "upcoming";
        return (
          <li
            key={step}
            className={
              "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold " +
              (state === "current"
                ? "bg-[#136f63] text-white"
                : state === "done"
                  ? "bg-[#d1ece6] text-[#0b5d53]"
                  : "bg-[#eef2f6] text-[#8a99a8]")
            }
          >
            <span
              className={
                "flex h-5 w-5 items-center justify-center rounded-full text-[11px] " +
                (state === "current"
                  ? "bg-white text-[#136f63]"
                  : state === "done"
                    ? "bg-[#0b5d53] text-white"
                    : "bg-[#cbd7e3] text-white")
              }
            >
              {index + 1}
            </span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md bg-[#dbeafe] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#1e4e79]">
      {children}
    </div>
  );
}

export function BannerNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md bg-[#e3f0fb] px-4 py-2 text-sm text-[#1e4e79]">{children}</p>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function TextField({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  inputMode
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
}) {
  return (
    <label className={fieldLabel}>
      <span>
        {label}
        {required ? <span className="text-[#b42318]"> *</span> : null}
      </span>
      <input
        className={control}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = "Select"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={fieldLabel}>
      <span>
        {label}
        {required ? <span className="text-[#b42318]"> *</span> : null}
      </span>
      <select
        className={control}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RadioGroup({
  label,
  value,
  onChange,
  options,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  required?: boolean;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-[#344456]">
        {label}
        {required ? <span className="text-[#b42318]"> *</span> : null}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm text-[#344456]">
            <input
              type="radio"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckboxGroup({
  label,
  values,
  onToggle,
  options,
  required
}: {
  label: string;
  values: string[];
  onToggle: (value: string) => void;
  options: Option[];
  required?: boolean;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-[#344456]">
        {label}
        {required ? <span className="text-[#b42318]"> *</span> : null}
      </legend>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm text-[#344456]">
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={() => onToggle(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FileField({
  label,
  required,
  fileName,
  onSelect,
  capture
}: {
  label: string;
  required?: boolean;
  fileName: string | null;
  onSelect: (file: File | null) => void;
  // When set, mobile browsers open the camera (e.g. "environment" = rear) on
  // tap; desktop browsers ignore it and show the normal file picker.
  capture?: "user" | "environment";
}) {
  const accept = ".jpg,.jpeg,.png,image/jpeg,image/png";
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSelect(event.target.files?.[0] ?? null);
  };
  const uploadControl =
    "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#136f63] bg-[#136f63] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f5d53]";
  const secondaryControl =
    "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#cbd7e3] bg-white px-3 py-2 text-sm font-semibold text-[#344456] transition hover:bg-[#eef2f6]";

  return (
    <fieldset className={fieldLabel}>
      <legend>
        {label}
        {required ? <span className="text-[#b42318]"> *</span> : null}
      </legend>
      {capture ? (
        <div className="flex flex-wrap gap-2 rounded-md border border-dashed border-[#cbd7e3] bg-[#f8fafc] px-3 py-3">
          <label className={uploadControl}>
            <Camera aria-hidden size={18} />
            Open camera
            <input
              className="sr-only"
              type="file"
              accept={accept}
              capture={capture}
              onChange={handleChange}
            />
          </label>
          <label className={secondaryControl}>
            <Upload aria-hidden size={18} />
            Choose file
            <input className="sr-only" type="file" accept={accept} onChange={handleChange} />
          </label>
          {fileName ? (
            <span className="flex min-h-10 items-center text-sm font-semibold text-[#344456]">
              {fileName}
            </span>
          ) : null}
        </div>
      ) : (
        <input
          className="rounded-md border border-dashed border-[#cbd7e3] bg-[#f8fafc] px-3 py-3 text-sm text-[#5f6c7b] file:mr-3 file:rounded-md file:border-0 file:bg-[#136f63] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
          type="file"
          accept={accept}
          onChange={handleChange}
        />
      )}
      <span className="text-xs font-normal text-[#5f6c7b]">
        {fileName
          ? `Selected: ${fileName}`
          : capture
            ? "Open the camera or choose a file. .jpeg, .jpg, .png. Max 20MB."
            : "Accepts .jpeg, .jpg, .png. Max 20MB."}
      </span>
    </fieldset>
  );
}
