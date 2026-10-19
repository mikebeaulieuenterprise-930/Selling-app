import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Lead } from "@/lib/supabase/types";
import { Pill, type Tone } from "./ui";

const statusTone: Record<string, Tone> = {
  new: "neutral",
  contacted: "accent",
  replied: "warn",
  call_booked: "good",
  won: "good",
  lost: "bad",
};

const temperatureTone: Record<string, Tone> = { hot: "good", warm: "warn", cold: "bad" };

export function StatusPill({ status, t }: { status: string; t: Dictionary }) {
  const label = t.enums.status[status as keyof typeof t.enums.status] ?? status;
  return <Pill tone={statusTone[status] ?? "neutral"}>{label}</Pill>;
}

export function TemperaturePill({ temperature, t }: { temperature: Lead["temperature"]; t: Dictionary }) {
  if (!temperature) return null;
  const label = t.enums.temperature[temperature as keyof typeof t.enums.temperature] ?? temperature;
  return <Pill tone={temperatureTone[temperature] ?? "neutral"}>{label}</Pill>;
}
