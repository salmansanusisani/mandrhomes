"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline btn-sm print:hidden">
      <Printer className="h-3.5 w-3.5" /> Print invoice
    </button>
  );
}
