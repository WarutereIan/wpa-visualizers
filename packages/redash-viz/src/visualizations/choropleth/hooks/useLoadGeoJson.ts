import { isString, isObject, get } from "lodash";
import { useState, useEffect } from "react";
import axios from "axios";
import { visualizationsSettings } from "@/visualizations/visualizationsSettings";
import createReferenceCountingCache from "@/lib/referenceCountingCache";

const cache = createReferenceCountingCache();

export function geoJsonFromResponse(response: unknown) {
  const data = isObject(response) ? (response as { data?: unknown }).data : undefined;
  return isObject(data) ? data : null;
}

export default function useLoadGeoJson(mapType: any) {
  const [geoJson, setGeoJson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mapUrl = get(visualizationsSettings, `choroplethAvailableMaps.${mapType}.url`, undefined);

    if (isString(mapUrl)) {
      setIsLoading(true);
      setError(null);
      let cancelled = false;

      const promise = cache.get(mapUrl, () => axios.get(mapUrl));
      promise
        .then((response: unknown) => {
          if (cancelled) return;
          const data = geoJsonFromResponse(response);
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'object | null' is not assignable... Remove this comment to see the full error message
          setGeoJson(data);
          setError(data ? null : "Map data is invalid.");
          setIsLoading(false);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setGeoJson(null);
          setIsLoading(false);
          setError(err instanceof Error && err.message ? err.message : "Failed to load map.");
        });

      return () => {
        cancelled = true;
        cache.release(mapUrl);
      };
    } else {
      setGeoJson(null);
      setIsLoading(false);
      setError(mapType ? "No GeoJSON URL is configured for this map." : null);
    }
  }, [mapType]);

  return [geoJson, isLoading, error];
}
