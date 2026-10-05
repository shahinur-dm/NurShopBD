"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FolderIcon,
  SlidersIcon,
  ActivityIcon,
} from "@/components/admin/AdminIcons";

interface BackupSummary {
  valid: boolean;
  createdAt: string;
  version: string;
  totalRecords: number;
  summary: Record<string, number>;
}

export default function AdminBackupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"download" | "restore">(
    rawTab === "restore" ? "restore" : "download"
  );

  useEffect(() => {
    if (rawTab === "restore" || rawTab === "download") {
      setActiveTab(rawTab);
    }
  }, [rawTab]);

  function handleTabChange(tab: "download" | "restore") {
    setActiveTab(tab);
    router.replace(`/admin/backup?tab=${tab}`);
  }

  // --- Download State ---
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // --- Restore State ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<Record<string, unknown> | null>(null);
  const [validationReport, setValidationReport] = useState<BackupSummary | null>(null);
  const [validating, setValidating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Trigger Download
  async function handleDownloadBackup() {
    setDownloading(true);
    setDownloadStatus("Preparing backup...");
    setDownloadError("");
    setDownloadSuccess(false);

    try {
      // 1. Fetch manifest to know all collections and counts
      const manifestRes = await fetch("/api/admin/backup?manifest=true");
      if (!manifestRes.ok) {
        const data = await manifestRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to initialize backup manifest");
      }
      const manifest = await manifestRes.json();
      const collectionsList: string[] = manifest.collectionsList || [];
      const counts: Record<string, number> = manifest.counts || {};

      const backupCollections: Record<string, unknown[]> = {};

      // 2. Fetch each collection safely in chunks
      for (const col of collectionsList) {
        const total = counts[col] || 0;
        if (total === 0) {
          backupCollections[col] = [];
          continue;
        }

        const batchSize = col === "products" || col === "mediaItems" ? 5 : 50;
        const colItems: unknown[] = [];

        for (let skip = 0; skip < total; skip += batchSize) {
          setDownloadStatus(`Downloading ${col} (${Math.min(skip + batchSize, total)}/${total})...`);
          const res = await fetch(`/api/admin/backup?collection=${col}&skip=${skip}&limit=${batchSize}`);
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to fetch collection ${col}`);
          }
          const chunkData = await res.json();
          if (Array.isArray(chunkData.data)) {
            colItems.push(...chunkData.data);
          }
        }

        backupCollections[col] = colItems;
      }

      setDownloadStatus("Compiling complete backup (.json)...");

      const fullBackup = {
        system: "NUR SHOP BD",
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        exportedBy: manifest.exportedBy,
        counts: manifest.counts,
        totalRecords: manifest.totalRecords,
        collections: backupCollections,
      };

      const jsonStr = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .slice(0, 19);
      const filename = `nurshopbd_backup_${timestamp}.json`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadSuccess(true);
    } catch (err: unknown) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
      setDownloadStatus("");
    }
  }

  // File Selection & Pre-Validation
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationReport(null);
    setRestoreError("");
    setRestoreSuccess(false);
    setValidating(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setParsedBackup(json);

      // Validate with server via dryRun
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup: json, dryRun: true }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Validation failed");
      }

      setValidationReport(data);
    } catch (err: unknown) {
      setRestoreError(
        err instanceof Error ? err.message : "Failed to parse or validate backup file"
      );
      setParsedBackup(null);
      setValidationReport(null);
    } finally {
      setValidating(false);
    }
  }

  // Execute Restore
  async function handleExecuteRestore() {
    if (!parsedBackup) return;
    setShowConfirmModal(false);
    setRestoring(true);
    setRestoreStatus("Restoring database records...");
    setRestoreError("");
    setRestoreSuccess(false);

    try {
      const collections = parsedBackup.collections as Record<string, unknown[]> | undefined;
      if (collections && typeof collections === "object") {
        for (const [colName, records] of Object.entries(collections)) {
          if (!Array.isArray(records) || records.length === 0) continue;
          setRestoreStatus(`Restoring ${colName} (${records.length} records)...`);
          const res = await fetch("/api/admin/backup/restore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ collection: colName, records, dryRun: false }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Failed restoring ${colName}`);
          }
        }
      } else {
        const res = await fetch("/api/admin/backup/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ backup: parsedBackup, dryRun: false }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Restoration failed");
        }
      }

      setRestoreSuccess(true);
      setSelectedFile(null);
      setParsedBackup(null);
      setValidationReport(null);
    } catch (err: unknown) {
      setRestoreError(err instanceof Error ? err.message : "Restoration failed");
    } finally {
      setRestoring(false);
      setRestoreStatus("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-navy">
            Backup & Restore
          </h1>
          <p className="text-xs text-steel">
            Safely download complete website backups or restore system data
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-md border border-line bg-paper p-1">
          <button
            type="button"
            onClick={() => handleTabChange("download")}
            className={`flex items-center gap-2 rounded px-4 py-2 text-xs font-bold transition ${
              activeTab === "download"
                ? "bg-navy text-white shadow-xs"
                : "text-steel hover:text-navy"
            }`}
          >
            <FolderIcon size={16} />
            Download Backup
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("restore")}
            className={`flex items-center gap-2 rounded px-4 py-2 text-xs font-bold transition ${
              activeTab === "restore"
                ? "bg-orange text-white shadow-xs"
                : "text-steel hover:text-navy"
            }`}
          >
            <SlidersIcon size={16} />
            Restore Backup
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DOWNLOAD BACKUP */}
      {/* ========================================================= */}
      {activeTab === "download" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-line bg-white p-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-wider text-navy">
                  Full System Backup Generation
                </h2>
                <p className="mt-1 text-xs text-steel max-w-2xl leading-relaxed">
                  Generates an all-inclusive, non-destructive JSON snapshot containing all 18 database collections (products, categories, media library records, company settings, orders, customer accounts, and activity logs).
                </p>
              </div>
              <span className="rounded bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 border border-teal-200">
                100% Non-Destructive
              </span>
            </div>

            {/* Inclusions List */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { title: "Products Catalog", desc: "All 33+ products & variants" },
                { title: "Categories & Subs", desc: "All 119+ category trees" },
                { title: "Brands & Services", desc: "All service offerings" },
                { title: "Website Settings", desc: "Branding, contacts & SEO" },
                { title: "Media Library", desc: "Uploaded assets metadata" },
                { title: "Orders & Users", desc: "Customer records & orders" },
                { title: "Hero Banners", desc: "Homepage slider configs" },
                { title: "Activity Logs", desc: "Audit history & actions" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded border border-line/70 bg-paper/50 p-3"
                >
                  <p className="text-xs font-bold text-navy">{item.title}</p>
                  <p className="mt-0.5 text-[10px] text-steel">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Error Message */}
            {downloadError && (
              <div className="mt-5 rounded border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600">
                {downloadError}
              </div>
            )}

            {/* Success Message */}
            {downloadSuccess && (
              <div className="mt-5 rounded border border-teal-500/30 bg-teal-500/10 p-3.5 text-xs font-medium text-teal-800">
                ✓ Full backup generated and downloaded successfully! Store this file safely.
              </div>
            )}

            {/* Action Button */}
            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadBackup}
                className="btn-orange flex items-center gap-2.5 px-6 py-3 text-xs font-bold uppercase tracking-wider shadow-md disabled:opacity-50"
              >
                <FolderIcon size={16} />
                {downloading
                  ? downloadStatus || "Compiling Backup Data..."
                  : "Download Complete Backup (.json)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: RESTORE BACKUP */}
      {/* ========================================================= */}
      {activeTab === "restore" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-line bg-white p-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-wider text-navy">
                  Restore Website from Backup
                </h2>
                <p className="mt-1 text-xs text-steel max-w-2xl leading-relaxed">
                  Upload a previously generated NUR SHOP BD JSON backup file to restore products, categories, settings, and media records.
                </p>
              </div>
              <span className="rounded bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                Safe Atomic Upsert
              </span>
            </div>

            {/* Upload Area */}
            <div className="mt-6">
              <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-paper/40 p-8 text-center cursor-pointer hover:border-orange hover:bg-paper transition">
                <FolderIcon size={36} className="text-steel" />
                <span className="mt-2 text-xs font-bold text-navy">
                  {selectedFile ? selectedFile.name : "Click or drag backup .json file here"}
                </span>
                <span className="mt-1 text-[11px] text-steel">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB selected`
                    : "Supported format: nurshopbd_backup_*.json"}
                </span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Validation Loading */}
            {validating && (
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-steel">
                <ActivityIcon size={16} className="animate-spin text-orange" />
                Validating backup file schema and integrity...
              </div>
            )}

            {/* Error Message */}
            {restoreError && (
              <div className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600">
                {restoreError}
              </div>
            )}

            {/* Success Message */}
            {restoreSuccess && (
              <div className="mt-4 rounded border border-teal-500/30 bg-teal-500/10 p-3.5 text-xs font-semibold text-teal-800">
                ✓ Website restoration completed successfully! All caches were cleared and paths revalidated.
              </div>
            )}

            {/* Validation Summary Report */}
            {validationReport && validationReport.valid && (
              <div className="mt-6 rounded border border-line bg-paper p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-navy">
                      Backup Verified: Ready to Restore
                    </p>
                    <p className="text-[11px] text-steel mt-0.5">
                      Created: {new Date(validationReport.createdAt).toLocaleString()} | Version: {validationReport.version}
                    </p>
                  </div>
                  <span className="rounded bg-teal-100 px-2.5 py-1 text-[11px] font-bold text-teal-800">
                    {validationReport.totalRecords} Records Found
                  </span>
                </div>

                {/* Collection Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11.5px]">
                  {Object.entries(validationReport.summary).map(([key, count]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded bg-white px-2.5 py-1.5 border border-line/60"
                    >
                      <span className="capitalize text-steel font-medium truncate">{key}</span>
                      <span className="font-bold text-navy ml-2">{count}</span>
                    </div>
                  ))}
                </div>

                {/* Action Trigger */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={restoring}
                    onClick={() => setShowConfirmModal(true)}
                    className="btn-orange px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-md disabled:opacity-50"
                  >
                    {restoring ? restoreStatus || "Restoring Records..." : "Proceed to Restore Data"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-navy">
              Confirm Database Restore
            </h3>
            <p className="mt-2 text-xs text-steel leading-relaxed">
              You are about to restore <strong className="text-navy">{validationReport?.totalRecords} records</strong> into the live database. Existing matching records will be safely updated, and missing items will be inserted.
            </p>

            <div className="mt-4 rounded bg-amber-50 p-3 border border-amber-200 text-[11px] text-amber-800">
              ⚠️ <strong>Notice:</strong> This action will update current products, categories, and settings with the data contained in this backup.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded border border-line bg-paper px-4 py-2 text-xs font-semibold text-navy hover:bg-line"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="btn-orange px-5 py-2 text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Yes, Restore Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
