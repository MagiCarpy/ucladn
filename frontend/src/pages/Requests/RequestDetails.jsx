import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/toastContext";
import { useSocket } from "@/context/SocketContext";
import Loading from "../../pages/Loading/Loading";
import Chat from "../../components/Chat";
import { PageContainer } from "@/components/layout/PageContainer";

const RequestDetails = () => {
  const { id } = useParams();
  const { user, authFetch } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const resp = await authFetch(`/api/requests/${id}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.request) {
            setRequest(data.request);
          } else {
            setError("Request not found");
            showToast("Request not found", "error");
          }
        } else {
          setError("Failed to load request");
          showToast("Failed to load request", "error");
        }
      } catch {
        setError("Error loading request");
        showToast("Error loading request", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  useEffect(() => {
    const handleUpdated = (updatedReq) => {
      setRequest((prev) => {
        if (prev && prev.id === updatedReq.id) {
          return updatedReq;
        }
        return prev;
      });
    };

    const handleDeleted = ({ id }) => {
      setRequest((prev) => {
        if (prev && prev.id === id) {
          return null;
        }
        return prev;
      });
    };

    socket.on("request:updated", handleUpdated);
    socket.on("request:deleted", handleDeleted);

    return () => {
      socket.off("request:updated", handleUpdated);
      socket.off("request:deleted", handleDeleted);
    };
  }, [socket]);

  if (loading) return <Loading />;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!request) return <div className="p-8">Request not found</div>;

  const isParticipant =
    user &&
    (user.userId === request.userId || user.userId === request.helperId);

  return (
    <PageContainer className="max-w-2xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        &larr; Back
      </Button>

      <div className="bg-card border rounded-lg p-6 mb-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">{request.item}</h1>
        {request.description && (
          <div className="text-xs text-muted-foreground mb-3 break-words">
            <strong className="">Description:</strong>{" "}
            <em> {request.description} </em>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="font-semibold text-muted-foreground">Pickup</p>
            <p>{request.pickupLocation}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">Dropoff</p>
            <p>{request.dropoffLocation}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">Status</p>
            <p className="capitalize">{request.status}</p>
          </div>
        </div>
      </div>

      {isParticipant ? (
        <div>
          <h2 className="text-xl font-bold mb-4">Chat</h2>
          <Chat requestId={id} />
        </div>
      ) : (
        <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
          You must be the requester or the helper to view the chat.
        </div>
      )}
    </PageContainer>
  );
};

export default RequestDetails;
