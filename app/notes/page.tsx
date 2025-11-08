"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useRouter } from "next/navigation";

interface NoteAttachmentSummary {
  id: string;
  fileName: string;
  fileType: string | null;
  sizeBytes: number;
  createdAt: string;
}

interface NoteSummary {
  id: string;
  title?: string | null;
  content?: string | null;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  attachments: NoteAttachmentSummary[];
}

const STORAGE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024;

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageBytes, setUsageBytes] = useState(0);
  const [limitBytes, setLimitBytes] = useState(STORAGE_LIMIT_BYTES);

  const storagePercent = Math.min(100, Math.round((usageBytes / limitBytes) * 100));

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(2)} ${sizes[i]}`;
  }

  function renderContentWithLinks(text?: string | null) {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(/\n+/).map((line, index) => (
      <p key={index} className="text-gray-900 leading-relaxed break-words">
        {line.split(urlRegex).map((part, partIdx) => {
          if (part.startsWith("http://") || part.startsWith("https://")) {
            return (
              <a
                key={`link-${index}-${partIdx}`}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {part}
              </a>
            );
          }
          return <span key={`text-${index}-${partIdx}`}>{part}</span>;
        })}
      </p>
    ));
  }

  async function fetchNotes() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load notes");

      setNotes(data.notes || []);
      setUsageBytes(data.usageBytes ?? 0);
      setLimitBytes(data.limitBytes ?? STORAGE_LIMIT_BYTES);
    } catch (err: any) {
      console.error("Error fetching notes:", err);
      setError(err.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(noteId: string, attachment: NoteAttachmentSummary) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/notes/${noteId}/attachments/${attachment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to download file");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = attachment.fileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("Error downloading attachment:", err);
      setError(err.message || "Failed to download file");
    }
  }

  async function handleDeleteAttachment(noteId: string, attachment: NoteAttachmentSummary) {
    if (!confirm(`Delete ${attachment.fileName}?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/notes/${noteId}/attachments/${attachment.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete attachment");

      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? {
                ...note,
                attachments: note.attachments.filter((item) => item.id !== attachment.id),
              }
            : note
        )
      );
      setUsageBytes(data.usageBytes ?? usageBytes);
    } catch (err: any) {
      console.error("Error deleting attachment:", err);
      setError(err.message || "Failed to delete attachment");
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const hasContent = content.trim().length > 0;
    const hasFiles = !!files && files.length > 0;

    if (!hasContent && !hasFiles) {
      setError("Add some note text or upload at least one document before saving.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const form = new FormData();
      form.append("content", content);

      if (files) {
        Array.from(files).forEach((file) => {
          form.append("attachments", file);
        });
      }

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save note");

      setNotes((prev) => [data.note, ...prev]);
      setUsageBytes(data.usageBytes ?? usageBytes);
      setLimitBytes(data.limitBytes ?? STORAGE_LIMIT_BYTES);

      setContent("");
      setFiles(null);
      setSelectedFileNames([]);
    } catch (err: any) {
      console.error("Error creating note:", err);
      setError(err.message || "Failed to save note");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm("Delete this note? This will remove all attachments.")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete note");

      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      setUsageBytes(data.usageBytes ?? usageBytes);
    } catch (err: any) {
      console.error("Error deleting note:", err);
      setError(err.message || "Failed to delete note");
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Notes & Personal Storage
          </h1>

          <div className="mb-6 bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-gray-700 font-medium">Storage Usage</p>
                <p className="text-sm text-gray-500">
                  {formatBytes(usageBytes)} of {formatBytes(limitBytes)} used ({storagePercent}%)
                </p>
              </div>
              {usageBytes >= limitBytes && (
                <span className="text-sm text-red-600 font-semibold">Storage limit reached. Delete existing notes to free space.</span>
              )}
            </div>
            <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  storagePercent > 90
                    ? "bg-red-500"
                    : storagePercent > 70
                    ? "bg-amber-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Add a Note</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Note</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write anything you need to remember. URLs become clickable links."
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Upload documents</label>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="note-attachments"
                  className="inline-flex w-max items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-blue-700 transition"
                >
                  Choose files
                </label>
                <input
                  id="note-attachments"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const fileList = e.target.files;
                    setFiles(fileList);
                    setSelectedFileNames(fileList ? Array.from(fileList).map((file) => file.name) : []);
                  }}
                />
                {selectedFileNames.length > 0 && (
                  <ul className="space-y-1 text-sm text-gray-700">
                    {selectedFileNames.map((name) => (
                      <li key={name} className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                        <span className="break-all">{name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Attach any file you need to keep handy. Files count toward your storage limit.</p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || usageBytes >= limitBytes}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                {submitting ? "Saving..." : "Save Note"}
              </button>
            </div>
          </form>

          <section className="space-y-4">
            {loading ? (
              <p className="text-gray-600 animate-pulse">Loading notes...</p>
            ) : notes.length === 0 ? (
              <div className="bg-white border border-dashed border-blue-300 rounded-xl p-6 text-center text-gray-700">
                No notes yet. Create your first note to keep track of ideas, links, or documents.
              </div>
            ) : (
              notes.map((note) => (
                <article key={note.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <p className="text-sm text-gray-600">
                      Updated {new Date(note.updatedAt).toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="self-start md:self-auto bg-rose-500 hover:bg-rose-600 text-white text-sm px-3 py-2 rounded-lg transition"
                    >
                      Delete
                    </button>
                  </header>

                  {note.content && (
                    <div className="space-y-2 text-base">
                      {renderContentWithLinks(note.content)}
                    </div>
                  )}

                  {!note.content && note.attachments.length === 0 && (
                    <p className="text-sm text-gray-500">No text saved for this note.</p>
                  )}

                  {note.attachments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-800 mb-2">Attachments</p>
                      <ul className="space-y-2">
                        {note.attachments.map((attachment) => (
                          <li
                            key={attachment.id}
                            className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-semibold text-blue-700 break-all">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-blue-500">
                                {formatBytes(attachment.sizeBytes)} • Added {new Date(attachment.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleDownload(note.id, attachment)}
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                Download
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(note.id, attachment)}
                                className="text-sm font-medium text-rose-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
