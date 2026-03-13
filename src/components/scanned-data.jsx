import React from "react";

const ScanedData = ({ data, handleClick, loading }) => {
  return (
    <div className="font-bold h-full flex flex-col justify-around items-center gap-8">
      <div>Scanned Data:</div>
      <div>{JSON.stringify(data)}</div>
      <button
        className="text-white px-6 py-4 w-fit rounded-xl bg-blue-500 hover:bg-blue-700"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
};

export default ScanedData;
