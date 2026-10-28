"use client";

import { useCallback, useEffect, useState } from "react";
import { paletteForWeatherCode, type Palette } from "./canvas-logic";

/** The city someone chose, per browser, so the canvas remembers their weather. */
const CITY_KEY = "ziki:midnight-city";

type Weather = {
  palette: Palette | null;
  place: string | null;
  loading: boolean;
  error: string | null;
  lookUp: (city: string) => void;
  clear: () => void;
};

/**
 * Opt-in local weather for the canvas palette. Nothing is looked up until
 * someone types a city (the site's Permissions-Policy turns browser location
 * off, and a typed city shares less anyway). The city goes to Open-Meteo's
 * free geocoding and forecast APIs, which need no key; only its current
 * weather code comes back.
 */
export function useWeatherPalette(): Weather {
  const [palette, setPalette] = useState<Palette | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookUp = useCallback(async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const found = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(city)}`,
      ).then((res) => res.json() as Promise<{ results?: { name: string; country?: string; latitude: number; longitude: number }[] }>);
      const hit = found.results?.[0];
      if (!hit) {
        setError("Couldn't find that city.");
        return;
      }
      const forecast = await fetch(
        `https://api.open-meteo.com/v1/forecast?current=weather_code&latitude=${hit.latitude}&longitude=${hit.longitude}`,
      ).then((res) => res.json() as Promise<{ current?: { weather_code?: number } }>);
      const code = forecast.current?.weather_code;
      if (typeof code !== "number") {
        setError("The weather didn't come through. Try again later.");
        return;
      }
      setPalette(paletteForWeatherCode(code));
      setPlace(hit.country ? `${hit.name}, ${hit.country}` : hit.name);
      try {
        window.localStorage.setItem(CITY_KEY, city);
      } catch {
        // No storage: it just won't be remembered.
      }
    } catch {
      setError("The weather service didn't answer. Try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Someone who chose a city before gets their weather again.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(CITY_KEY);
    } catch {
      return;
    }
    if (!saved) return;
    const city = saved;
    const start = window.setTimeout(() => lookUp(city), 0);
    return () => window.clearTimeout(start);
  }, [lookUp]);

  const clear = useCallback(() => {
    setPalette(null);
    setPlace(null);
    try {
      window.localStorage.removeItem(CITY_KEY);
    } catch {
      // Nothing saved to forget.
    }
  }, []);

  return { palette, place, loading, error, lookUp, clear };
}
