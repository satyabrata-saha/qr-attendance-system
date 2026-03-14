"use client";

import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, Camera, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ScanedData from "./scanned-data";

export default function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const isTransitioningRef = useRef(false);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "starting" | "scanning" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const startScanner = async () => {
    if (isTransitioningRef.current || isRunningRef.current) return;

    try {
      isTransitioningRef.current = true;
      setStatus("starting");
      setMessage("Accessing camera...");

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
            const parsedData = JSON.parse(decodedText);
            setData(parsedData);
            setStatus("success");
            setMessage("QR Code captured!");
            await stopScanner();
          } catch (err) {
            console.warn("Invalid QR format: Expected JSON", err);
          }
        },
        () => {},
      );

      isRunningRef.current = true;
      setStatus("scanning");
      setMessage("Position QR code within the frame");
    } catch (err) {
      console.error("Camera start error:", err);
      setStatus("error");
      setMessage("Failed to start camera. Check permissions.");
    } finally {
      isTransitioningRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
        isRunningRef.current = false;
      } catch (err) {
        console.error("Stop error:", err);
      }
    }
  };

  const handleAttendanceSubmit = async () => {
    if (loading || !data) return;

    setLoading(true);
    try {
      const response = await fetch("/api/v1/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setMessage("Attendance submitted successfully!");

        setTimeout(async () => {
          setData(null);
          setLoading(false);
          setStatus("idle");

          setTimeout(async () => {
            await startScanner();
          }, 100);
        }, 2000);
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
    const initTimeout = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      clearTimeout(initTimeout);
      stopScanner().then(() => {
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch (e) {}
        }
      });
    };
  }, []);

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
        <h1 className="text-xl font-bold px-4">Attendance</h1>
      </div>

      <div className="rounded-2xl bg-gray-800 p-4 shadow-lg border border-gray-700">
        {!data && (
          <div
            id="reader"
            className={`overflow-hidden rounded-xl bg-black min-h-[300px] ${data ? "hidden" : "block"}`}
          />
        )}

        {data && (
          <div className="min-h-[300px] flex flex-col items-center justify-center p-4 text-center">
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
                <ScanedData
                  data={data}
                  handleClick={handleAttendanceSubmit}
                  loading={loading}
                />
              </>
            )}
          </div>
        )}

        <div className="mt-4 text-center">
          {status === "starting" && (
            <p className="flex items-center justify-center gap-2 text-yellow-400">
              <Loader2 className="h-4 w-4 animate-spin" /> {message}
            </p>
          )}

          {status === "scanning" && (
            <p className="flex items-center justify-center gap-2 text-blue-400 text-sm">
              <Camera className="h-4 w-4" /> {message}
            </p>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <p className="text-red-400 font-medium text-sm">{message}</p>
              <button
                onClick={() => startScanner()}
                className="text-xs bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-600"
              >
                Try Again
              </button>
            </div>
          )}

          {loading && (
            <p className="text-yellow-400 animate-pulse text-sm font-medium">
              Syncing with server...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
