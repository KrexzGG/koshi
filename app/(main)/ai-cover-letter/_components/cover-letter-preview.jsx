"use client";

import React, { useEffect, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Save } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { updateCoverLetter } from "@/actions/cover-letter";

const CoverLetterPreview = ({ id, content }) => {
  const [value, setValue] = useState(content || "");
  const { loading, fn: updateFn } = useFetch(updateCoverLetter);

  useEffect(() => {
    setValue(content || "");
  }, [content]);

  const handleSave = async () => {
    await updateFn(id, (value || "").trim());
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    const markdown = value || content || '';
    const htmlContent = markdown
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 24px; margin: 20px 0 10px 0; font-weight: bold;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 18px; margin: 15px 0 8px 0; font-weight: bold;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; margin: 12px 0 6px 0; font-weight: bold;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n\n/g, '</p><p style="margin: 8px 0;">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p style="margin: 8px 0;">')
      .replace(/$/, '</p>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cover Letter</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; background: #fff; margin: 0; padding: 20px; }
            h1, h2, h3 { color: #000; }
            a { color: #00f; text-decoration: underline; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="py-4 space-y-3" data-color-mode="light">
      <div className="flex items-center justify-end gap-2">
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button onClick={handleSave} disabled={loading} variant="secondary">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>
      <MDEditor value={value} onChange={setValue} height={700} />
    </div>
  );
};

export default CoverLetterPreview;
