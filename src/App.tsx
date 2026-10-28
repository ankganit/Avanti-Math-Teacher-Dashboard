import React from 'react';

export default function App() {
  return (
    <div className="fixed inset-0 w-full h-full m-0 p-0 overflow-hidden bg-slate-900">
      <iframe
        src="./dashboard.html"
        title="Math Teacher Dashboard"
        className="w-full h-full border-0 block"
        allow="clipboard-write; clipboard-read"
      />
    </div>
  );
}
