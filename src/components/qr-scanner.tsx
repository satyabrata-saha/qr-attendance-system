"use client";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeCameraScanConfig,
} from "html5-qrcode";
import {
  ArrowLeft,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Flashlight,
  FlashlightOff,
  Play,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ScanedData from "./scanned-data";

type ScanResult = {
  rawText: string;
  parsedJson: any | null;
  format?: string;
};

export default function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const isMountedRef = useRef(false);
  const hasScannedRef = useRef(false);
  const lastScanRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoStart = true;

  const [data, setData] = useState<any>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const [status, setStatus] = useState<
    "idle" | "starting" | "scanning" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("Preparing scanner...");

  const readerId = "attendance-qr-reader";

  const formats = useMemo(
    () => [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.AZTEC,
      Html5QrcodeSupportedFormats.DATA_MATRIX,
      Html5QrcodeSupportedFormats.PDF_417,
    ],
    [],
  );

  const parseData = (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const clearResumeTimer = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  const setSafeState = useCallback((updater: () => void) => {
    if (isMountedRef.current) updater();
  }, []);

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current || !isRunningRef.current) return;

    try {
      isTransitioningRef.current = true;
      await scannerRef.current.stop();
    } catch (err) {
      console.warn("Scanner stop warning:", err);
    } finally {
      isRunningRef.current = false;
      isTransitioningRef.current = false;
      setTorchOn(false);
      setTorchSupported(false);
    }
  }, []);

  const clearScanner = useCallback(() => {
    if (!scannerRef.current) return;

    try {
      scannerRef.current.clear();
    } catch (err) {
      console.warn("Scanner clear warning:", err);
    } finally {
      scannerRef.current = null;
    }
  }, []);

  const detectTorchSupport = useCallback(async () => {
    if (!scannerRef.current || !isRunningRef.current) {
      setTorchSupported(false);
      return;
    }

    try {
      const capabilities = scannerRef.current.getRunningTrackCapabilities?.();
      const hasTorch = !!capabilities?.torch;
      setTorchSupported(hasTorch);
    } catch {
      setTorchSupported(false);
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current || !isRunningRef.current || !torchSupported) return;

    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as any],
      });
      setTorchOn((prev) => !prev);
    } catch (err) {
      console.warn("Torch toggle failed:", err);
    }
  }, [torchOn, torchSupported]);

  const onDecoded = useCallback(
    async (decodedText: string, decodedResult: any) => {
      const now = Date.now();

      // prevent duplicate rapid fires
      if (
        lastScanRef.current === decodedText &&
        now - lastScanTimeRef.current < 2000
      ) {
        return;
      }

      if (hasScannedRef.current) return;

      const parsedData = parseData(decodedText);

      if (!parsedData) {
        console.warn("Invalid QR format: Expected JSON");
        return;
      }

      hasScannedRef.current = true;
      lastScanRef.current = decodedText;
      lastScanTimeRef.current = now;

      const scanResult: ScanResult = {
        rawText: decodedText,
        parsedJson: parsedData,
        format: decodedResult?.result?.format?.formatName,
      };

      setSafeState(() => {
        setResult(scanResult);
        setData(parsedData);
        setStatus("success");
        setMessage("QR Code captured!");
      });

      await stopScanner();
    },
    [setSafeState, stopScanner],
  );

  const startScanner = useCallback(async () => {
    if (
      !isMountedRef.current ||
      isTransitioningRef.current ||
      isRunningRef.current
    ) {
      return;
    }

    try {
      clearResumeTimer();
      hasScannedRef.current = false;

      setSafeState(() => {
        setStatus("starting");
        setMessage("Accessing rear camera...");
      });

      isTransitioningRef.current = true;

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerId, {
          verbose: false,
        });
      }

      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.floor(minEdge * 0.7);
          return {
            width: Math.max(180, Math.min(boxSize, 300)),
            height: Math.max(180, Math.min(boxSize, 300)),
          };
        },
        aspectRatio: 1.333333,
        disableFlip: false,
        formatsToSupport: formats,
      };

      await scannerRef.current.start(
        { facingMode: { exact: "environment" } },
        config,
        onDecoded,
        () => {},
      );

      isRunningRef.current = true;

      setSafeState(() => {
        setStatus("scanning");
        setMessage("Align QR code inside the frame");
      });

      await detectTorchSupport();
    } catch (err) {
      console.warn("Primary rear camera failed, trying fallback...", err);

      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(readerId, { verbose: false });
        }

        const fallbackConfig: Html5QrcodeCameraScanConfig = {
          fps: 10,
          qrbox: 250,
          aspectRatio: 1.333333,
          disableFlip: false,
          formatsToSupport: formats,
        };

        await scannerRef.current.start(
          { facingMode: "environment" },
          fallbackConfig,
          onDecoded,
          () => {},
        );

        isRunningRef.current = true;

        setSafeState(() => {
          setStatus("scanning");
          setMessage("Align QR code inside the frame");
        });

        await detectTorchSupport();
      } catch (fallbackErr) {
        console.error("Camera start failed:", fallbackErr);

        setSafeState(() => {
          setStatus("error");
          setMessage(
            "Could not access camera. Allow permission and try again.",
          );
        });
      } finally {
        isTransitioningRef.current = false;
      }

      return;
    } finally {
      isTransitioningRef.current = false;
    }
  }, [detectTorchSupport, formats, onDecoded, setSafeState]);

  const handleRescan = useCallback(async () => {
    clearResumeTimer();
    await stopScanner();
    clearScanner();

    if (!isMountedRef.current) return;

    hasScannedRef.current = false;
    setData(null);
    setResult(null);
    setLoading(false);
    setStatus("idle");
    setMessage("Ready to scan again");

    setTimeout(() => {
      startScanner();
    }, 250);
  }, [clearScanner, startScanner, stopScanner]);

  const handleAttendanceSubmit = async () => {
    if (loading || !data) return;

    setLoading(true);
    setMessage("Syncing with server...");

    try {
      const response = await fetch("/api/v1/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setMessage("Attendance submitted successfully!");
        setStatus("success");

        resumeTimerRef.current = setTimeout(async () => {
          if (!isMountedRef.current) return;

          setData(null);
          setResult(null);
          setLoading(false);
          setStatus("idle");
          setMessage("Ready to scan again");

          clearScanner();

          setTimeout(async () => {
            await startScanner();
          }, 300);
        }, 1200);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error: any) {
      console.error(error.message);
      setStatus("error");
      setMessage("Failed to submit attendance.");
      setLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (autoStart) {
      const t = setTimeout(() => {
        if (isMountedRef.current) {
          startScanner();
        }
      }, 300);

      return () => {
        isMountedRef.current = false;
        clearTimeout(t);
        clearResumeTimer();

        (async () => {
          await stopScanner();
          clearScanner();
        })();
      };
    }

    return () => {
      isMountedRef.current = false;
      clearResumeTimer();

      (async () => {
        await stopScanner();
        clearScanner();
      })();
    };
  }, [autoStart, clearScanner, startScanner, stopScanner]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-2 hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-xl font-bold px-4 py-2 rounded-xl">Attendance</h1>
      </div>

      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 shadow-xl">
        {/* KEEP MOUNTED WHEN SCANNING VIEW */}
        {!result && (
          <div
            id={readerId}
            className="overflow-hidden rounded-2xl bg-black min-h-[320px] sm:min-h-[360px]"
          />
        )}

        {result && (
          <div className="min-h-[320px] sm:min-h-[360px] flex flex-col items-center justify-center p-4 text-center">
            {!loading && message === "Attendance submitted successfully!" ? (
              <div className="space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto" />
                <p className="text-lg font-bold text-green-400">{message}</p>
              </div>
            ) : (
              <>
                <div className="bg-green-500/20 p-4 rounded-full mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                </div>

                <div className="mb-4">
                  <p className="text-lg font-semibold text-green-400">
                    QR Code Captured
                  </p>
                  {result.format && (
                    <p className="text-xs text-gray-400 mt-1">
                      Format: {result.format}
                    </p>
                  )}
                </div>

                <ScanedData
                  data={data}
                  handleClick={handleAttendanceSubmit}
                  handleRescan={handleRescan}
                  loading={loading}
                />

                {!loading && (
                  <button
                    onClick={handleRescan}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Scan Again
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {status === "idle" && !isRunningRef.current && !result && (
            <button
              onClick={startScanner}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 font-medium transition-colors"
            >
              <Play className="h-4 w-4" />
              Start Scanner
            </button>
          )}

          {status === "starting" && (
            <p className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {message}
            </p>
          )}

          {status === "scanning" && (
            <>
              <p className="flex items-center justify-center gap-2 text-blue-400 text-sm text-center">
                <Camera className="h-4 w-4" />
                {message}
              </p>

              <button
                onClick={toggleTorch}
                disabled={!torchSupported}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm font-medium transition-colors"
              >
                {torchOn ? (
                  <>
                    <FlashlightOff className="h-4 w-4" />
                    Torch Off
                  </>
                ) : (
                  <>
                    <Flashlight className="h-4 w-4" />
                    {torchSupported ? "Torch On" : "Torch Not Supported"}
                  </>
                )}
              </button>
            </>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <p className="flex items-center justify-center gap-2 text-red-400 text-sm text-center">
                <AlertCircle className="h-4 w-4" />
                {message}
              </p>

              <button
                onClick={startScanner}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-3 font-medium transition-colors"
              >
                <Play className="h-4 w-4" />
                Try Again
              </button>
            </div>
          )}

          {loading && (
            <p className="text-yellow-400 animate-pulse text-sm font-medium text-center">
              Syncing with server...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
