import QRScanner from "@/components/qr-scanner";

export default function Scan() {
  return (
    <div className="min-h-dvh bg-gray-800 text-white tracking-wide px-3 py-4 flex flex-col justify-between">
      <QRScanner />
    </div>
  );
}
