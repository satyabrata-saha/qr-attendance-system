import QRScanner from "@/components/qr-scanner";

export default function Scan() {
  return (
    <main className="min-h-dvh bg-gray-950 text-white tracking-wide px-3 py-4 flex items-start justify-center">
      <QRScanner />
    </main>
  );
}
