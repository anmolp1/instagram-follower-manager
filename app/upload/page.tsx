"use client";

import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/file-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          Upload your Instagram data export files (followers_1.json and following.json) to analyze your follower relationships.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to get your data</CardTitle>
          <CardDescription>Follow these steps to download your Instagram data</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="text-muted-foreground list-inside list-decimal space-y-2 text-sm">
            <li>Open Instagram and go to <strong className="text-foreground">Settings</strong></li>
            <li>Navigate to <strong className="text-foreground">Your Activity</strong></li>
            <li>Select <strong className="text-foreground">Download Your Information</strong></li>
            <li>Choose <strong className="text-foreground">JSON</strong> as the format</li>
            <li>Select <strong className="text-foreground">Followers and Following</strong> data</li>
            <li>Download and extract the ZIP file</li>
            <li>Upload the <code className="bg-muted rounded px-1.5 py-0.5 text-xs">followers_1.json</code> and <code className="bg-muted rounded px-1.5 py-0.5 text-xs">following.json</code> files below</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>Drag and drop or click to select your JSON files</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
