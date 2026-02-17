"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SessionImport } from "@/components/session-import";
import { PasteImport } from "@/components/paste-import";
import { Button } from "@/components/ui/button";
import { ClipboardPaste, Cookie } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"session" | "paste">("session");

  const handleSuccess = () => {
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Instagram Data</h1>
        <p className="text-muted-foreground mt-2">
          Fetch your followers and following automatically using your browser session, or paste them manually.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={method === "session" ? "default" : "outline"}
          onClick={() => setMethod("session")}
          className="flex-1"
        >
          <Cookie className="mr-2 h-4 w-4" />
          Auto-fetch (Recommended)
        </Button>
        <Button
          variant={method === "paste" ? "default" : "outline"}
          onClick={() => setMethod("paste")}
          className="flex-1"
        >
          <ClipboardPaste className="mr-2 h-4 w-4" />
          Paste manually
        </Button>
      </div>

      {method === "session" ? (
        <SessionImport onSuccess={handleSuccess} />
      ) : (
        <PasteImport onSuccess={handleSuccess} />
      )}
    </div>
  );
}
