import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/context/toastContext";
import { useSocket } from "../../context/SocketContext";
import Loading from "../Loading/Loading";
import { API_BASE_URL } from "@/config";
import { PageContainer } from "@/components/layout/PageContainer";

function RequestsList() {
  const socket = useSocket();
  const { showToast } = useToast();
  const { user, authFetch } = useAuth();
  const [userPos, setUserPos] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filterBy, setFilterBy] = useState("all");
  const [appliedFilter, setAppliedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const activeDelivery = requests.find(
    (req) => req.helperId === user?.userId && req.status === "accepted"
  );
  const userIsBusy = Boolean(activeDelivery);

  // get current user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const fetchRequests = async () => {
    const resp = await authFetch("/api/requests");
    const data = await resp.json();
    setRequests(data.requests || []);
    setLoading(false);
  };

  // fetch and socket listeners INIT
  useEffect(() => {
    fetchRequests();

    if (!socket) return;

    const handleCreated = (newReq) => {
      setRequests((prev) => [newReq, ...prev]);
    };

    const handleUpdated = (updatedReq) => {
      setRequests((prev) =>
        prev.map((req) => (req.id === updatedReq.id ? updatedReq : req))
      );
    };

    const handleDeleted = ({ id }) => {
      setRequests((prev) =>
        prev.filter((req) => {
          return req.id !== id;
        })
      );
    };

    socket.on("request:created", handleCreated);
    socket.on("request:updated", handleUpdated);
    socket.on("request:deleted", handleDeleted);

    return () => {
      socket.off("request:created", handleCreated);
      socket.off("request:updated", handleUpdated);
      socket.off("request:deleted", handleDeleted);
    };
  }, [socket]);

  const acceptRequest = async (id) => {
    const resp = await authFetch(`/api/requests/${id}/accept`, {
      method: "POST",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (resp.ok) {
      showToast("Request accepted!", "success");
      fetchRequests();
    } else {
      showToast("Unable to accept request", "error");
    }
  };

  const deleteRequest = async (id) => {
    const resp = await authFetch(`/api/requests/${id}`, {
      method: "DELETE",
    });

    if (resp.ok) {
      showToast("Request deleted", "success");
      fetchRequests();
    } else {
      showToast("Failed to delete request", "error");
    }
  };

  const confirmReceived = async (request) => {
    await authFetch(`/api/requests/${request.id}/confirm-received`, {
      method: "POST",
    });
    fetchRequests();
    showToast("Delivery confirmed as received!", "success");
  };

  const confirmNotReceived = async (request) => {
    await authFetch(`/api/requests/${request.id}/confirm-not-received`, {
      method: "POST",
    });
    fetchRequests();
    showToast("Delivery marked as NOT received", "error");
  };

  const handleApplyFilter = () => {
    setAppliedFilter(filterBy);
  };

  const handleViewRoute = (selectedRoute) => {
    navigate("/dashboard", { state: selectedRoute });
  };

  if (loading) return <Loading />;

  return (
    <PageContainer className="max-w-4xl">
      <div className="flex justify-between w-full">
        <h2 className="text-3xl font-bold mb-6 text-blue-700 dark:text-blue-300">
          Requests
        </h2>
        <Button
          className="text-white text-xs"
          onClick={() => {
            if (searchQuery != user.username) setSearchQuery(user.username);
            else setSearchQuery("");
          }}
        >
          {searchQuery == user.username ? "All Requests" : "My Requests"}
          {searchQuery != user.username && (
            <img
              className="w-6 h-6 rounded-full shadow-md object-cover border-2 border-blue-400 dark:border-blue-300"
              src={`${API_BASE_URL}/public/${user?.profileImg || "default.jpg"}`}
            ></img>
          )}
        </Button>
      </div>

      {/* Active Delivery Banner */}
      {userIsBusy && activeDelivery && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-100 text-yellow-900 border border-yellow-300 shadow-sm">
          <p className="font-medium font-bold text-lg leading-relaxed">
            Active Delivery:
          </p>
          <p className="text-base mt-2 break-words">{activeDelivery.item}</p>

          <p className="text-sm text-yellow-700 pb-2 break-words">
            {activeDelivery.pickupLocation} → {activeDelivery.dropoffLocation}
          </p>

          <Button
            className="bg-green-400"
            onClick={() => handleViewRoute(activeDelivery)}
          >
            View Route
          </Button>
        </div>
      )}

      {/* FILTER SECTION */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3 w-full">
          <input
            type="text"
            placeholder="Search by user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 w-full"
          />

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="flex-1 w-full"
          >
            <option value="all">All Distances</option>
            <option value="50">Less than 50 meters</option>
            <option value="100">Less than 100 meters</option>
            <option value="200">Less than 200 meters</option>
            <option value="300">Less than 300 meters</option>
            <option value="500">Less than 500 meters</option>
            <option value="700">Less than 700 meters</option>
            <option value="1000">Less than 1000 meters</option>
            <option value="1500">Less than 1500 meters</option>
            <option value="1500+">1500+ meters</option>
          </select>

          <Button
            onClick={handleApplyFilter}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium w-full md:w-auto px-6"
            disabled={filterBy === appliedFilter}
          >
            Apply Filter
          </Button>
        </div>

        {appliedFilter !== "all" && (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span>Active:</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              {appliedFilter === "1500+"
                ? "1500+ meters"
                : `< ${appliedFilter} meters`}
            </span>
            <Button
              onClick={() => {
                setFilterBy("all");
                setAppliedFilter("all");
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {requests.length === 0 && (
        <p className="text-gray-600">No requests yet.</p>
      )}

      {/* Sort requests by active delivery, accepted request, your other requests, all other requests*/}
      {requests
        .sort((a, b) => {
          const aPriority = getRequestPriority(a, user?.userId);
          const bPriority = getRequestPriority(b, user?.userId);
          return aPriority - bPriority;
        })
        .map((req) => {
          const pickup = [req.pickupLat, req.pickupLng];
          const dist = getDistance(userPos, pickup);
          const showDist = calcDistFilter(dist, appliedFilter);

          // Filter by username
          const username = req.user?.username || "";
          const matchesSearch = username
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

          if (!showDist || !matchesSearch) return null;

          const isAcceptedByUser =
            userIsBusy && activeDelivery && activeDelivery.id === req.id;

          // COMPUTED STATUS LABELS
          let statusLabel = req.status;

          if (req.status === "completed") {
            if (req.deliveryStatus === "received") {
              statusLabel = "Completed — Received ✔";
            } else if (req.deliveryStatus === "not_received") {
              statusLabel = "Completed — Not Received ✘";
            } else {
              statusLabel = "Completed — Awaiting Confirmation";
            }
          }

          return (
            <div
              key={req.id}
              className="border border-border p-5 mb-4 rounded-lg shadow-sm bg-card text-card-foreground hover:shadow-md transition-shadow overflow-hidden w-full"
            >
              <div className="flex flex-col md:flex-row justify-between items-start mb-2 gap-4">
                <h3 className="font-bold text-2xl text-shadow-outline break-words min-w-0 flex-1">
                  {req.item}
                </h3>
                <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-2 w-full md:w-auto shrink-0">
                  {user &&
                    req.userId !== user.userId &&
                    req.status === "open" && (
                      <Button
                        onClick={() => acceptRequest(req.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={userIsBusy}
                      >
                        Accept
                      </Button>
                    )}
                  {req.userId === user.userId && (
                    <Button
                      variant="destructive"
                      onClick={() => deleteRequest(req.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              {req.description && (
                <p className="text-sm text-muted-foreground mb-4 break-words">
                  <strong className="">Description:</strong>{" "}
                  <em> {req.description} </em>
                </p>
              )}

              {/* DETAILS */}
              <div className="text-sm">
                <p>
                  <strong>Requested by:</strong>{" "}
                  {req.user?.username || "Unknown"}
                </p>
                <p>
                  <strong>Pickup:</strong> {req.pickupLocation}
                </p>
                <p>
                  <strong>Dropoff:</strong> {req.dropoffLocation}
                </p>

                {/* STATUS */}
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="capitalize font-medium">{statusLabel}</span>
                </p>

                {/* Accepted banner */}
                {isAcceptedByUser && (
                  <p className="mt-1 text-xs font-semibold text-blue-700">
                    You accepted this request
                  </p>
                )}

                {/* Receiver confirmation badges */}
                {req.deliveryStatus === "received" && (
                  <div className="mt-2 p-2 rounded bg-green-100 text-green-800 text-xs font-semibold w-fit">
                    Delivery Confirmed ✔
                  </div>
                )}

                {req.deliveryStatus === "not_received" && (
                  <div className="mt-2 p-2 rounded bg-red-100 text-red-800 text-xs font-semibold w-fit">
                    Delivery Marked as NOT Received ✘
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center w-full mt-4 pt-4 border-t border-border gap-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Button onClick={() => handleViewRoute(req)} className="w-full md:w-auto">
                    View Route
                  </Button>
                  {user &&
                    (req.userId === user.userId ||
                      req.helperId === user.userId) && (
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/requests/${req.id}`)}
                        className="w-full md:w-auto"
                      >
                        Chat
                      </Button>
                    )}
                </div>

                {/* On the bottom right either show Receive/Not Received or Distance */}
                {user &&
                req.userId === user.userId &&
                req.status === "completed" ? (
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Button
                      onClick={() => confirmReceived(req)}
                      className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
                    >
                      Received
                    </Button>
                    <Button
                      onClick={() => confirmNotReceived(req)}
                      variant="destructive"
                      className="w-full md:w-auto"
                    >
                      Not Received
                    </Button>
                  </div>
                ) : (
                  user &&
                  dist !== null && (
                    <div className="flex justify-center md:justify-end w-full md:w-auto">
                      <span className="text-sm font-semibold text-foreground bg-muted px-3 py-1.5 rounded-full whitespace-nowrap">
                        ~{Math.round(dist)} meters away
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })
        .filter(Boolean)}
    </PageContainer>
  );
}

// Helpers

const getRequestPriority = (request, userId) => {
  // your delivery
  if (request.helperId === userId && request.status === "accepted") {
    return 1;
  }

  // your accepted requests
  if (request.userId === userId && request.status === "accepted") {
    return 2;
  }

  // your requests
  if (request.userId === userId) {
    return 3;
  }

  // other requests
  return 4;
};

const getDistance = (coord1, coord2) => {
  if (!(Array.isArray(coord1) && Array.isArray(coord2))) return null;
  const R = 6371008.8;
  const [y1, x1] = coord1,
    [y2, x2] = coord2;
  let dx = x2 - x1,
    dy = y2 - y1;
  let mid = (y1 + y2) / 2;

  dx = dx * (Math.PI / 180);
  dy = dy * (Math.PI / 180);
  mid = mid * (Math.PI / 180);

  const x = dx * R * Math.cos(mid);
  const y = dy * R;
  return Math.sqrt(x ** 2 + y ** 2);
};

const calcDistFilter = (dist, filterVal) => {
  if (!dist) return true;
  switch (filterVal) {
    case "all":
      return true;
    case "1500+":
      return dist >= 1500;
    default:
      return dist < parseInt(filterVal, 10);
  }
};

export default RequestsList;
