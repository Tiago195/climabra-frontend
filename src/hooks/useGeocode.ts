import { useEffect, useRef, useState } from "react";
import {
  buildGeoKey,
  geocodeAddress,
  getCachedCoords,
  type GeoCoords,
  type GeocodeAddress,
} from "@/services/geocoding";

export type GeocodeStatus = "idle" | "cached" | "loading" | "ready" | "not_found" | "error";

export interface UseGeocodeResult {
  coords: GeoCoords | null;
  status: GeocodeStatus;
}

export function useGeocode(address: GeocodeAddress | null | undefined): UseGeocodeResult {
  const key = address ? buildGeoKey(address) : "";
  const [coords, setCoords] = useState<GeoCoords | null>(() =>
    address ? getCachedCoords(address) : null,
  );
  const [status, setStatus] = useState<GeocodeStatus>(() =>
    address && getCachedCoords(address) ? "cached" : "idle",
  );
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!address || !key.replace(/\|/g, "").trim()) {
      setCoords(null);
      setStatus("idle");
      lastKey.current = "";
      return;
    }
    if (lastKey.current === key) return;
    lastKey.current = key;

    const cached = getCachedCoords(address);
    if (cached) {
      setCoords(cached);
      setStatus("cached");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setCoords(null);
    geocodeAddress(address)
      .then(result => {
        if (cancelled || lastKey.current !== key) return;
        if (result) {
          setCoords(result);
          setStatus("ready");
        } else {
          setCoords(null);
          setStatus("not_found");
        }
      })
      .catch(() => {
        if (cancelled || lastKey.current !== key) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [key, address]);

  return { coords, status };
}
