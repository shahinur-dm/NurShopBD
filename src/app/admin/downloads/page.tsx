"use client";

import { FormEvent, useEffect, useState } from "react";

type Kind = "catalogue" | "manual";

interface DownloadItem {
  _id: string;
  kind: Kind;
  title: string;
  filename: string;
  size: number;
  order: number;
  downloadUrl: string;
}

export default function AdminDownloadsPage() {
  const [kind, setKind] = useState<Kind>("catalogue");
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DownloadItem | null>(null);
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    loadItems(kind);
  }, [kind]);

  async function loadItems(nextKind: Kind) {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/downloads?kind=${nextKind}`);
      const data = await res.json();
      if (Array.isArray(data.items)) setItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setTitle("");
    setOrder(items.length + 1);
    setFile(null);
    setError("");
    setUploadProgress(0);
    setModalOpen(true);
  }

  function openEdit(item: DownloadItem) {
    setEditing(item);
    setTitle(item.title);
    setOrder(item.order || 0);
    setFile(null);
    setError("");
    setUploadProgress(0);
    setModalOpen(true);
  }

  async function uploadFileInChunks(params: {
    file: File;
    title: string;
    kind: Kind;
    order: number;
    editingId?: string;
    onProgress: (percent: number) => void;
  }) {
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks safely below Vercel's 4.5MB payload limit
    const totalSize = params.file.size;
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

    // 1. Initialize chunked session
    const initRes = await fetch("/api/admin/downloads/chunk?action=init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: params.title,
        kind: params.kind,
        filename: params.file.name,
        mimeType: params.file.type || "application/pdf",
        totalSize,
        totalChunks,
        order: params.order,
        editingId: params.editingId,
      }),
    });
    const initData = await initRes.json();
    if (!initRes.ok) throw new Error(initData.error || "Failed to initialize upload");
    const { uploadId } = initData;

    // 2. Upload each chunk sequentially
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);
      const chunkBlob = params.file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append("uploadId", uploadId);
      chunkFormData.append("chunkIndex", String(i));
      chunkFormData.append("chunk", chunkBlob, params.file.name);

      let success = false;
      let lastErr = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const chunkRes = await fetch("/api/admin/downloads/chunk?action=chunk", {
            method: "POST",
            body: chunkFormData,
          });
          const chunkData = await chunkRes.json();
          if (!chunkRes.ok) throw new Error(chunkData.error || "Chunk upload failed");
          success = true;
          break;
        } catch (err) {
          lastErr = err instanceof Error ? err.message : "Network error";
          await new Promise((r) => setTimeout(r, 600));
        }
      }
      if (!success) {
        throw new Error(`Failed uploading chunk ${i + 1}/${totalChunks}: ${lastErr}`);
      }

      const percent = Math.round(((i + 1) / totalChunks) * 100);
      params.onProgress(percent);
    }

    // 3. Finalize and assemble in MongoDB GridFS
    const compRes = await fetch("/api/admin/downloads/chunk?action=complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }),
    });
    const compData = await compRes.json();
    if (!compRes.ok) throw new Error(compData.error || "Failed to finalize upload");

    return compData.item;
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setUploadProgress(0);
    try {
      if (!editing && !file) {
        setError("Please choose a PDF file.");
        setSaving(false);
        return;
      }

      if (file && file.size > 50 * 1024 * 1024) {
        setError("File size exceeds 50MB upload limit. Please choose a smaller PDF.");
        setSaving(false);
        return;
      }

      if (file && file.size > 3 * 1024 * 1024) {
        // Use chunked upload for files > 3MB (supports 10MB, 25MB, up to 50MB on Vercel without 413 error)
        await uploadFileInChunks({
          file,
          title,
          kind,
          order,
          editingId: editing?._id,
          onProgress: (p) => setUploadProgress(p),
        });
      } else {
        // Direct upload for smaller files or metadata edits
        const formData = new FormData();
        formData.set("title", title);
        formData.set("kind", kind);
        formData.set("order", String(order));
        if (file) formData.set("file", file);

        const url = editing ? `/api/admin/downloads/${editing._id}` : "/api/admin/downloads";
        const res = await fetch(url, { method: editing ? "PUT" : "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save");
      }

      setModalOpen(false);
      loadItems(kind);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(item: DownloadItem) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    const res = await fetch(`/api/admin/downloads/${item._id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to delete");
      return;
    }
    loadItems(kind);
  }

  const label = kind === "catalogue" ? "Catalogue" : "User Manual";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-navy">
            Download Management
          </h2>
          <p className="text-xs text-steel">
            Upload, replace, and remove catalogue and user manual PDFs shown on the website.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-orange px-4 py-2 text-xs font-bold uppercase shadow-sm">
          + Add {label}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setKind("catalogue")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${
            kind === "catalogue" ? "bg-navy text-white" : "border border-line bg-white text-navy"
          }`}
        >
          Catalogue
        </button>
        <button
          type="button"
          onClick={() => setKind("manual")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${
            kind === "manual" ? "bg-navy text-white" : "border border-line bg-white text-navy"
          }`}
        >
          User Manual
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-xs">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[500px] text-left text-xs">
            <thead className="border-b border-line bg-paper/50 font-display text-[11px] font-bold uppercase tracking-wider text-navy">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-mist">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-mist">
                    No {label.toLowerCase()} files yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-3 font-semibold text-navy">{item.title}</td>
                    <td className="px-4 py-3 text-steel">{item.filename}</td>
                    <td className="px-4 py-3 text-steel">
                      {item.size ? `${(item.size / (1024 * 1024)).toFixed(2)} MB` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a href={item.downloadUrl} className="mr-3 font-semibold text-navy hover:text-orange">
                        Download
                      </a>
                      <button type="button" onClick={() => openEdit(item)} className="mr-3 font-semibold text-navy hover:text-orange">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(item)} className="font-semibold text-red-600">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <form onSubmit={handleSave} className="w-full max-w-md space-y-4 rounded-lg border border-line bg-white p-5 shadow-xl">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
              {editing ? `Edit ${label}` : `Add ${label}`}
            </h3>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <label className="block text-xs font-semibold text-navy">
              Title / Name
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-navy">
              PDF file {editing ? "(leave empty to keep current file)" : ""}
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 w-full text-xs"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="border border-line px-4 py-2 text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-orange px-4 py-2 text-xs font-bold uppercase">
                {saving
                  ? uploadProgress > 0 && uploadProgress < 100
                    ? `Uploading ${uploadProgress}%...`
                    : "Saving..."
                  : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
