"use client";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import ScanedData from "./scanned-data";

export default function QRScanner() {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const qrRef = useRef(null);

  const startScanner = async () => {
    if (!qrRef.current) return;

    try {
      await qrRef.current.start(
        { facingMode: { exact: "environment" } },
        {
          fps: 10,
          qrbox: 250,
        },
        async (decodedText) => {
          try {
            setData(JSON.parse(decodedText));
            await qrRef.current.stop();
          } catch {
            console.log("Invalid QR JSON");
          }
        },
      );
    } catch (err) {
      console.error("Camera start error:", err);
    }
  };

  const handleClick = async () => {
    if (loading) return; // prevent double submit

    setLoading(true);

    try {
      const response = await fetch("/api/v1/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setData("Attendance submitted successfully");
      }
    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setTimeout(async () => {
        setLoading(false);
        setData("");

        await qrRef.current.clear();
        await startScanner();
      }, 1200);
    }
  };

  useEffect(() => {
    qrRef.current = new Html5Qrcode("reader");
    startScanner();

    return () => {
      if (qrRef.current) {
        qrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col gap-4 text-center">
      <div className="font-bold mt-8 text-xl text-white">
        Welcome to the <br /> QR Attendance System
      </div>

      <div id="reader" style={{ width: "300px", margin: "auto" }} />

      {data && (
        <ScanedData data={data} handleClick={handleClick} loading={loading} />
      )}

      {loading && (
        <div className="text-yellow-400 mt-4">Submitting attendance...</div>
      )}
    </div>
  );
}
