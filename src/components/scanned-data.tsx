import { Loader2, Send, XCircle } from "lucide-react";

const ScanedData = ({ data, handleClick, loading }) => {
  const dataEntries = Object.entries(data);

  return (
    <div className="w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Confirm Details</h2>
        <p className="text-gray-400 text-sm">
          Please verify the information below
        </p>
      </div>

      <div className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 space-y-3">
        {dataEntries.map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-center border-b border-gray-800 pb-2 last:border-0 last:pb-0"
          >
            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
              {key.replace("_", " ")}
            </span>
            <span className="text-blue-400 font-medium">{String(value)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col w-full gap-3">
        <button
          className="flex items-center justify-center gap-2 text-white px-6 py-4 w-full rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed font-bold"
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Submit Attendance
            </>
          )}
        </button>

        {!loading && (
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors py-2 text-sm"
          >
            <XCircle className="h-4 w-4" />
            Cancel & Rescan
          </button>
        )}
      </div>
    </div>
  );
};

export default ScanedData;
