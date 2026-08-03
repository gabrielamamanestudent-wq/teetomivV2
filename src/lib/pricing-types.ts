// Small shared type module so the pure pricing engine has no dependency on the
// data layer (keeps unit tests lightweight and import graphs clean).
export type TimeBand = "dawn" | "morning" | "midday" | "twilight";
export type Weather = "sun" | "cloud" | "rain";
