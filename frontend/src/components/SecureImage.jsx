import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export function SecureImage({ src, alt, className, fallbackSrc }) {
  const { authFetch } = useAuth();
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setObjectUrl(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    const fetchImage = async () => {
      try {
        const res = await authFetch(src);
        if (res.ok) {
          const blob = await res.blob();
          if (active) {
            const url = URL.createObjectURL(blob);
            setObjectUrl(url);
          }
        } else {
          if (active) setObjectUrl(null);
        }
      } catch (err) {
        console.error("SecureImage fetch error:", err);
        if (active) setObjectUrl(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (loading) {
    return <div className={`animate-pulse bg-muted rounded-md ${className}`} style={{ minHeight: "150px" }} />;
  }

  if (!objectUrl && fallbackSrc) {
    return <img src={fallbackSrc} alt={alt} className={className} />;
  }

  return objectUrl ? <img src={objectUrl} alt={alt} className={className} /> : null;
}

export default SecureImage;
