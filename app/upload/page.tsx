"use client";

import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/file-upload";

export default function UploadPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Instagram Data</h1>
        <p className="text-muted-foreground mt-2">
          Upload your Instagram data export files (followers and following JSON files).
        </p>
      </div>

      <FileUpload onSuccess={handleSuccess} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">How to export your data from Instagram</h2>
        <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
          <li>Go to Instagram Settings &rarr; Accounts Center &rarr; Your information and permissions</li>
          <li>Tap &quot;Download your information&quot; &rarr; &quot;Download or transfer information&quot;</li>
          <li>Select your account, then choose &quot;Some of your information&quot;</li>
          <li>Select &quot;Followers&quot; and &quot;Following&quot;, tap Next</li>
          <li>Choose &quot;Download to device&quot;, format &quot;JSON&quot;, then create the export</li>
          <li>Once ready, download the zip, extract it, and upload the JSON files above</li>
        </ol>
        <div className="aspect-video overflow-hidden rounded-lg">
          <iframe
            src="https://www.youtube.com/embed/4eh8eJAUEdk"
            title="How to export your Instagram data"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
