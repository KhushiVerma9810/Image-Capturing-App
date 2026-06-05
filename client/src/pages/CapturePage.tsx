import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, listImages, uploadImage } from "../api";
import { ImagePreview } from "../components/ImagePreview";
import { useShell } from "../components/AppShell";
import { CameraButtonIcon, CameraIcon, ImageIcon, SettingsIcon, UsersIcon } from "../components/icons";
import { Button } from "@/components/ui/button";
import type { ImageSummary } from "../types";

type FacingMode = "user" | "environment";

const pageSize = 6;

export function CapturePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<ImageSummary[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [guidesEnabled, setGuidesEnabled] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: pageSize, totalPages: 1 });
  const { searchQuery } = useShell();

  async function startCamera(nextFacingMode: FacingMode) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacingMode },
        audio: false
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraError(null);
    } catch {
      setCameraError("Camera access is required to capture images.");
    }
  }

  async function loadImages(nextPage = page, search = searchQuery.trim()) {
    const response = await listImages({ page: nextPage, limit: pageSize, search: search || undefined });
    setImages(response.images);
    setPagination(response.pagination);
    setPage(response.pagination.page);
  }

  useEffect(() => {
    void startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [facingMode]);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        await loadImages(1, searchQuery.trim());
      } catch (loadError) {
        if (!alive) return;
        setStatus(loadError instanceof ApiError ? loadError.message : "Unable to load recent captures.");
      }
    }
    void load();
    return () => { alive = false; };
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  async function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setStatus("Camera is not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      setStatus("Unable to capture the image.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.94);
    });

    if (!blob) {
      setStatus("Unable to prepare the captured image.");
      return;
    }

    const preview = URL.createObjectURL(blob);
    setCapturedUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return preview;
    });

    setIsUploading(true);
    setStatus(null);
    try {
      await uploadImage(blob, `capture-${Date.now()}.jpg`);
      setStatus("Image uploaded successfully.");
      await loadImages(page, searchQuery.trim());
    } catch (uploadError) {
      setStatus(uploadError instanceof ApiError ? uploadError.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  const recentImages = useMemo(() => images.filter((image) => image.id !== ""), [images]);

  return (
    <div className="capture-page">
      <div className="capture-hero">
        <div className="capture-status-row">
          <span className="pill live"><i />LIVE PREVIEW</span>
          <span className="pill">1080p • 60FPS</span>
          <span className="pill muted-pill">{facingMode === "environment" ? "Back Camera" : "Front Camera"}</span>
        </div>

        <div className="capture-stage">
          <div className="capture-video-wrap">
            <video ref={videoRef} autoPlay className="capture-video" muted playsInline />
            {guidesEnabled && <div className="capture-guides" />}
          </div>

          <div className="capture-overlay">
            {cameraError && <div className="status-banner error overlay-banner">{cameraError}</div>}
            {status && <div className="status-banner overlay-banner">{status}</div>}

            {capturedUrl && (
              <div className="captured-preview-card">
                <img alt="Captured preview" src={capturedUrl} />
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="capture-toolbar">
        <Button variant="ghost" className="toolbar-control" type="button">
          <SettingsIcon className="ui-icon" />
          <span>Settings</span>
        </Button>
        <Button
          variant="ghost"
          className="toolbar-control"
          type="button"
          onClick={() => setFacingMode((mode) => (mode === "environment" ? "user" : "environment"))}
        >
          <CameraIcon className="ui-icon" />
          <span>Switch Camera</span>
        </Button>

        <button className="capture-button" type="button" onClick={handleCapture} disabled={isUploading}>
          <CameraButtonIcon className="ui-icon capture-button-icon" />
        </button>

        <Button
          variant="ghost"
          className={`toolbar-control ${flashEnabled ? "active" : ""}`}
          type="button"
          onClick={() => setFlashEnabled((v) => !v)}
        >
          <span>Auto Flash</span>
        </Button>
        <Button
          variant="ghost"
          className={`toolbar-control ${guidesEnabled ? "active" : ""}`}
          type="button"
          onClick={() => setGuidesEnabled((v) => !v)}
        >
          <UsersIcon className="ui-icon" />
          <span>Guides</span>
        </Button>
      </section>

      <section className="capture-recent">
        <div className="capture-recent-title">
          <ImageIcon className="ui-icon" />
          <span>Recent Captures</span>
        </div>

        <div className="recent-strip">
          {recentImages.length === 0 ? (
            <p className="empty-copy">No captured images yet.</p>
          ) : (
            recentImages.map((image) => (
              <article className="recent-thumb" key={image.id}>
                <ImagePreview imageId={image.id} alt={image.originalName} />
                <span>{new Date(image.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="pagination-row capture-pagination">
        <button className="pagination-link" type="button" onClick={() => loadImages(Math.max(1, page - 1))} disabled={page <= 1}>
          Previous
        </button>
        <div className="pagination-pages">
          <button className="page-chip active" type="button">{page}</button>
          <span>of {pagination.totalPages}</span>
        </div>
        <button
          className="pagination-link"
          type="button"
          onClick={() => loadImages(Math.min(pagination.totalPages, page + 1))}
          disabled={page >= pagination.totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
