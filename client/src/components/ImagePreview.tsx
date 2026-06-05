import { useEffect, useState } from "react";
import { fetchImageBlob } from "../api";

export function ImagePreview({ imageId, alt }: { imageId: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    async function load() {
      try {
        const blob = await fetchImageBlob(imageId);
        objectUrl = URL.createObjectURL(blob);
        if (active) {
          setUrl(objectUrl);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageId]);

  if (loading) {
    return <div className="preview-skeleton">Loading preview...</div>;
  }

  if (!url) {
    return <div className="preview-skeleton">Preview unavailable</div>;
  }

  return <img className="preview-image" src={url} alt={alt} />;
}
