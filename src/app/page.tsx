import QRScanner from "@/components/qr-scanner";

export default function Home() {
  return (
    <div className="max-h-screen min-h-dvh p-4 bg-gray-800 tracking-wide">
      <QRScanner />
    </div>
  );
}
