import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "@/context/toastContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import SecureImage from "@/components/SecureImage";

function InfoPanel({
  request,
  clearSelection,
  currentUserHasActiveDelivery,
  // onRefresh is no longer needed as sockets handle updates
}) {
  const { user, authFetch } = useAuth();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    setSelectedFile(null);
    setLocalPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [request?.id, request?.status, request?.helperId]);

  const isHelper = user?.userId === request?.helperId;
  const isOwner = user?.userId === request?.userId;

  // Derive display state directly from props since Map.jsx ensures they are fresh via sockets
  const uploadedPhoto = request?.deliveryPhotoUrl || null;
  const receiverState = request?.receiverConfirmed || "pending";

  if (!request) {
    return (
      <div className="w-full md:w-[300px] bg-muted/30 border border-border p-4 md:p-5 h-1/3 md:h-full flex flex-col justify-center items-center text-center text-muted-foreground rounded-xl">
        <h3 className="text-lg font-semibold mb-2">No request selected</h3>
        <p className="text-sm">Click a marker on the map to view details.</p>
      </div>
    );
  }

  const deleteRequest = async () => {
    const resp = await authFetch(`/api/requests/${request.id}`, {
      method: "DELETE",
    });

    const data = await resp.json();

    if (!user || (resp.status >= 400 && resp.status < 500)) {
      showToast(data.message || "Login to delete requests", "error");
      return navigate("/login");
    } else if (!resp.ok) {
      showToast(data.message || "Failed to delete request", "error");
      return navigate("/login");
    } else {
      showToast("Request deleted", "success");
      clearSelection();
    }
  };

  const acceptRequest = async () => {
    const resp = await authFetch(`/api/requests/${request.id}/accept`, {
      method: "POST",
    });

    const data = await resp.json();

    if (!user || (resp.status >= 400 && resp.status < 500)) {
      showToast(data.message || "Login to accept requests", "error");
      return navigate("/login");
    } else if (!resp.ok) {
      showToast(data.message || "Unable to accept request", "error");
      return navigate("/login");
    } else {
      showToast("Request accepted!", "success");
      // Sockets will update the map state automatically
    }
  };

  const cancelDelivery = async () => {
    const resp = await authFetch(
      `/api/requests/${request.id}/cancel-delivery`,
      {
        method: "POST",
      },
    );

    const data = await resp.json();

    if (!resp.ok) {
      showToast(data.message || "Unable to cancel delivery", "error");
      return;
    }

    showToast("Delivery canceled", "info");
    setSelectedFile(null);
    setLocalPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // clearSelection(); // Optional: user might want to see it revert to open?
    // Usually keep selection open unless it's gone.
    // If we clear selection, they lose context. let's keep it (it will update to open).
  };

  const completeDelivery = async () => {
    setUploading(true);

    if (selectedFile) {
      const formData = new FormData();
      formData.append("photo", selectedFile);

      try {
        const resp = await authFetch(
          `/api/requests/${request.id}/upload-photo`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!resp.ok) {
          const data = await resp.json();
          showToast(data.message || "Failed to upload photo", "error");
          setUploading(false);
          return;
        }
      } catch (err) {
        console.error("Upload error during submit:", err);
        showToast("Failed to upload delivery photo", "error");
        setUploading(false);
        return;
      }
    }

    const resp = await authFetch(
      `/api/requests/${request.id}/complete-delivery`,
      {
        method: "POST",
      },
    );

    const data = await resp.json();

    if (!resp.ok) {
      showToast(data.message || "Could not complete delivery", "error");
      setUploading(false);
      return;
    }
    showToast("Delivery completed!", "success");
    setSelectedFile(null);
    setLocalPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setUploading(false);
  };

  const confirmReceived = async () => {
    await authFetch(`/api/requests/${request.id}/confirm-received`, {
      method: "POST",
    });
    // Sockets will update state
    showToast("Delivery confirmed as received!", "success");
  };

  const confirmNotReceived = async () => {
    await authFetch(`/api/requests/${request.id}/confirm-not-received`, {
      method: "POST",
    });
    showToast("Delivery marked as NOT received", "error");
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setSelectedFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="w-full md:w-[300px] bg-card border border-border p-4 md:p-5 md:h-full overflow-y-auto text-card-foreground shadow-md rounded-xl z-20">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold">{request.item}</h2>
        <Button size="icon" onClick={clearSelection} className="h-8 w-8">
          <span className="text-lg">×</span>
        </Button>
      </div>

      {/* Accepted-by-you banner */}
      {isHelper && request.status === "accepted" && (
        <div className="mb-3 px-3 py-2 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
          This is the delivery you accepted
        </div>
      )}

      {/* DETAILS */}
      <div className="space-y-3">
        <div>
          <span className="font-semibold block text-xs uppercase text-muted-foreground">
            Pickup
          </span>
          <p>{request.pickupLocation}</p>
        </div>

        <div>
          <span className="font-semibold block text-xs uppercase text-muted-foreground">
            Dropoff
          </span>
          <p>{request.dropoffLocation}</p>
        </div>

        <div>
          <span className="font-semibold block text-xs uppercase text-muted-foreground">
            Status
          </span>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              request.status === "open"
                ? "bg-blue-100 text-blue-800"
                : request.status === "accepted"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
            }`}
          >
            {request.status}
          </span>
        </div>

        <div>
          <span className="font-semibold block text-xs uppercase text-muted-foreground">
            Requested By
          </span>
          <p>{request.user?.username}</p>
        </div>

        {request.helperId && (
          <div>
            <span className="font-semibold block text-xs uppercase text-muted-foreground">
              Accepted By
            </span>
            <p>{request.helper?.username}</p>
          </div>
        )}
      </div>

      {/* DELIVERY PHOTO AREA */}
      {isHelper && request.status === "accepted" && (
        <div className="mt-8 space-y-2">
          <span className="font-semibold block text-xs uppercase text-muted-foreground">
            Delivery Confirmation
          </span>

          {localPreviewUrl ? (
            <div className="space-y-1">
              <img
                src={localPreviewUrl}
                alt="Delivery Confirmation Preview"
                className="rounded border w-full object-cover max-h-48"
              />
            </div>
          ) : uploadedPhoto ? (
            <SecureImage
              src={`/api/requests/${request.id}/photo`}
              alt="Delivery Confirmation"
              className="rounded border w-full"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No photo selected or uploaded yet.
            </p>
          )}

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handlePhotoSelect}
            disabled={uploading}
            className="text-sm"
          />

          {uploading && (
            <p className="text-xs text-yellow-600">Processing...</p>
          )}
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="mt-8 space-y-2">
        {/* ACCEPT BUTTON (only for non-owners) */}
        {request.status === "open" && !isOwner && (
          <>
            <Button
              disabled={currentUserHasActiveDelivery}
              onClick={acceptRequest}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Accept Request
            </Button>
          </>
        )}

        {/* Owner view when request is open */}
        {request.status === "open" && isOwner && (
          <p className="mt-2 text-xs text-muted-foreground">
            You created this request. Waiting for someone to accept it.
          </p>
        )}

        {/* DELETE (owner) */}
        {isOwner && (
          <Button
            variant="destructive"
            onClick={deleteRequest}
            className="w-full"
          >
            Delete Request
          </Button>
        )}

        {/* COMPLETE DELIVERY (helper only) */}
        {isHelper &&
          request.status === "accepted" &&
          (uploadedPhoto || selectedFile) && (
            <Button
              onClick={completeDelivery}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading
                ? "Completing Delivery..."
                : "Mark Delivery as Completed"}
            </Button>
          )}

        {isHelper && request.status === "accepted" && (
          <Button
            onClick={cancelDelivery}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            Cancel Delivery
          </Button>
        )}

        {/* RECEIVER CONFIRMATION */}
        {isOwner && request.status === "completed" && (
          <div className="space-y-2 mt-4">
            {receiverState === "pending" && (
              <>
                <p className="text-sm font-semibold text-muted-foreground">
                  Confirm Delivery
                </p>

                <Button
                  onClick={confirmReceived}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Received
                </Button>

                <Button
                  onClick={confirmNotReceived}
                  variant="destructive"
                  className="w-full"
                  style={{ backgroundColor: "red" }}
                >
                  Not Received
                </Button>
              </>
            )}

            {receiverState === "received" && (
              <div className="p-3 rounded bg-green-100 text-green-800 text-sm font-semibold">
                Delivery Confirmed ✔
              </div>
            )}

            {receiverState === "not_received" && (
              <div className="p-3 rounded bg-red-100 text-red-800 text-sm font-semibold">
                Delivery Marked as NOT Received ✘
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InfoPanel;
