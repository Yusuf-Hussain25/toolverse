import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../config/api";
import { useAccount } from "./useAccount";

// Runs one tool request: tracks elapsed time while it works, updates this month's usage,
// and turns quota or provider errors into clear messages.
export const useToolRun = (endpoint) => {
    const { setUsage, refresh } = useAccount();
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [result, setResult] = useState(null);
    const [quotaHit, setQuotaHit] = useState(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (!running) return;
        const started = Date.now();
        const t = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
        return () => clearInterval(t);
    }, [running]);

    const run = useCallback(
        async (body) => {
            setRunning(true);
            setElapsed(0);
            setQuotaHit(false);
            try {
                const { data } = await api.post(`/api/tools/${endpoint}`, body, { timeout: 180_000 });
                setUsage(data.usage);
                refresh(); // creation counts on the dashboard
                // Leaving the page doesn't cancel the work; the result is saved to My creations either way
                if (mounted.current) setResult(data.creation);
                return data.creation;
            } catch (err) {
                if (err.response?.data?.code === "QUOTA_REACHED") setQuotaHit(true);
                toast.error(errorMessage(err, "That didn't work. Try again."));
                return null;
            } finally {
                if (mounted.current) setRunning(false);
            }
        },
        [endpoint, setUsage, refresh]
    );

    return { run, running, elapsed, result, setResult, quotaHit };
};
