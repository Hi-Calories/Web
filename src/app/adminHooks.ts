import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "../shared/api-client";

export function useAdminFetch<T>(path: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(path, { signal: controller.signal });
      if (requestId === requestIdRef.current) setData(result);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (requestId !== requestIdRef.current) return;
      if (err instanceof ApiError || err instanceof Error) setError(err.message);
      else setError("Không thể kết nối đến máy chủ.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [path, ...deps]);

  useEffect(() => {
    void fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}
