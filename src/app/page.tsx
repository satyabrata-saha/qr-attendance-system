"use client";

import Link from "next/link";
import { RefreshCcw, ScanQrCode } from "lucide-react";
import { useEffect, useState } from "react";

interface AttendanceItem {
  id: number;
  user_id: string;
  created_at: string;
}

export default function Home() {
  const [data, setData] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function getData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/v1/attendance", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch attendance");
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
      setError("Something went wrong while fetching data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  return (
    <div className="min-h-dvh bg-gray-800 text-white tracking-wide px-3 py-4 pb-28">
      <div className="w-full min-h-[80vh] max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Attendance List</h1>

        {loading && !data.length && (
          <p className="text-center text-gray-300 py-8 italic animate-pulse">
            Loading attendance...
          </p>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-center">
            {error}
          </div>
        )}

        {!error && (
          <div className="overflow-x-auto rounded-2xl border border-gray-700 bg-gray-900 shadow-xl ">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 text-left">
                  <th className="border-b border-gray-700 p-4 font-semibold">
                    User
                  </th>
                  <th className="border-b border-gray-700 p-4 font-semibold">
                    Attended At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.length > 0 ? (
                  data.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="p-4 text-blue-400 font-mono text-sm">
                        {item.user_id}
                      </td>
                      <td className="p-4 text-gray-300 text-sm">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : !loading ? (
                  <tr>
                    <td colSpan={2} className="text-center p-12 text-gray-500">
                      No attendance data found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-4">
        <div className="max-w-md mx-auto flex justify-center gap-4 p-3 rounded-2xl bg-gray-900/80 backdrop-blur-md border border-gray-700 shadow-2xl">
          <Link href="/scan" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 text-white px-5 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-900/20">
              <ScanQrCode className="h-6 w-6" />
              <span className="font-bold">Scan QR</span>
            </button>
          </Link>

          <button
            className="flex items-center justify-center text-white p-4 rounded-xl bg-gray-800 hover:bg-gray-700 active:scale-95 disabled:opacity-50 transition-all border border-gray-700"
            onClick={getData}
            disabled={loading}
            aria-label="Refresh data"
          >
            <RefreshCcw
              className={`h-6 w-6 ${loading ? "animate-spin text-blue-400" : ""}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
