import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AGE_BRACKETS, ASSISTANCE_OPTIONS, DIETARY_OPTIONS, REGISTRATION_LIMITS, SEX_OPTIONS } from "../data/registration";

/** The editable subset of a registration row, as the admin API returns it. */
export interface EditableRegistration {
  id: string;
  name: string;
  firstName: string | null;
  middleInitial: string | null;
  lastName: string | null;
  nickname: string | null;
  email: string;
  mobile: string | null;
  agency: string | null;
  division: string | null;
  designation: string | null;
  ageBracket: string | null;
  sexAtBirth: string | null;
  dietaryPreferences: string | null;
  foodAllergies: string | null;
  specialAssistance: string | null;
  assistanceNeeded: string | null;
}

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-white/16 bg-white/5 text-white/94 text-[14px] font-sans focus:outline-none focus:ring-2 focus:ring-gates-blue focus:border-gates-blue";
const labelClass = "text-[12px] text-white/60 font-semibold";

// Checklists are stored "; "-joined (see the Worker's checklist()).
const splitChecklist = (value: string | null) => (value ? value.split("; ") : []);

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Checks({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 text-[13px] text-white/80 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => onToggle(option)}
            className="w-4 h-4 accent-gates-link"
          />
          {option}
        </label>
      ))}
    </div>
  );
}

export default function AdminRegistrationEditor({
  registration,
  onClose,
  onSaved,
}: {
  registration: EditableRegistration;
  onClose: () => void;
  onSaved: (updated: EditableRegistration) => void;
}) {
  const [form, setForm] = useState({
    firstName: registration.firstName ?? "",
    middleInitial: registration.middleInitial ?? "",
    lastName: registration.lastName ?? "",
    nickname: registration.nickname ?? "",
    email: registration.email,
    mobile: registration.mobile ?? "",
    agency: registration.agency ?? "",
    division: registration.division ?? "",
    designation: registration.designation ?? "",
    ageBracket: registration.ageBracket ?? "",
    sexAtBirth: registration.sexAtBirth ?? "",
    foodAllergies: registration.foodAllergies ?? "",
    assistanceNeeded: registration.assistanceNeeded ?? "",
  });
  const [dietary, setDietary] = useState(splitChecklist(registration.dietaryPreferences));
  const [assistance, setAssistance] = useState(splitChecklist(registration.specialAssistance));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key: keyof typeof form) => (value: string) => setForm((state) => ({ ...state, [key]: value }));
  const toggle = (list: string[], setList: (next: string[]) => void) => (option: string) =>
    setList(list.includes(option) ? list.filter((o) => o !== option) : [...list, option]);

  const text = (key: keyof typeof form, maxLength?: number, required = false, ref = false) => (
    <input
      ref={ref ? firstField : undefined}
      className={inputClass}
      type="text"
      value={form[key]}
      maxLength={maxLength}
      required={required}
      onChange={(e) => set(key)(e.target.value)}
    />
  );

  // Blank is allowed here: rows from before these were collected have neither.
  const select = (key: "ageBracket" | "sexAtBirth", options: readonly string[]) => (
    <select className={inputClass} value={form[key]} onChange={(e) => set(key)(e.target.value)}>
      <option value="">Not provided</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/registrations/${registration.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dietaryPreferences: dietary, specialAssistance: assistance }),
      });
      if (res.status === 401) {
        setError("Your session has expired. Reload the page and sign in again.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save the changes.");
        return;
      }
      onSaved(data);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={`Edit registration — ${registration.name}`}
        onSubmit={handleSubmit}
        className="w-full max-w-[640px] p-5 sm:p-7 flex flex-col gap-4 rounded-2xl border border-white/12 bg-[#0e0f13] shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold m-0">Edit registration</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
        <p className="text-[12px] text-white/45 m-0">
          Corrects the registrant&apos;s own details. Consent records are not editable. The change is audit-logged.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] gap-3">
          <Labeled label="First name *">{text("firstName", REGISTRATION_LIMITS.name, true, true)}</Labeled>
          <Labeled label="M.I.">{text("middleInitial", 2)}</Labeled>
          <Labeled label="Last name *">{text("lastName", REGISTRATION_LIMITS.name, true)}</Labeled>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Labeled label="Nickname">{text("nickname", REGISTRATION_LIMITS.nickname)}</Labeled>
          <Labeled label="Mobile number *">{text("mobile", REGISTRATION_LIMITS.mobile, true)}</Labeled>
        </div>
        <Labeled label="Email address *">
          <input
            className={inputClass}
            type="email"
            value={form.email}
            required
            onChange={(e) => set("email")(e.target.value)}
          />
        </Labeled>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Labeled label="Age bracket">{select("ageBracket", AGE_BRACKETS)}</Labeled>
          <Labeled label="Sex assigned at birth">{select("sexAtBirth", SEX_OPTIONS)}</Labeled>
        </div>
        <Labeled label="Agency / Organization *">{text("agency", REGISTRATION_LIMITS.agency, true)}</Labeled>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Labeled label="Division / Section">{text("division", REGISTRATION_LIMITS.division)}</Labeled>
          <Labeled label="Position / Designation *">{text("designation", REGISTRATION_LIMITS.designation, true)}</Labeled>
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelClass}>Dietary preferences</span>
          <Checks options={DIETARY_OPTIONS} selected={dietary} onToggle={toggle(dietary, setDietary)} />
          <Labeled label="Food allergies or other specific diet">
            {text("foodAllergies", REGISTRATION_LIMITS.foodAllergies)}
          </Labeled>
        </div>
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Special assistance</span>
          <Checks options={ASSISTANCE_OPTIONS} selected={assistance} onToggle={toggle(assistance, setAssistance)} />
          <Labeled label="Specific assistance needed">
            {text("assistanceNeeded", REGISTRATION_LIMITS.assistanceNeeded)}
          </Labeled>
        </div>

        {error && (
          <div role="alert" className="text-gates-error text-[13px]">
            {error}
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="glass-panel px-5 py-2.5 rounded-full text-sm text-white/85 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-6 py-2.5 rounded-full text-white font-bold text-sm border-none cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
