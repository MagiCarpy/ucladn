import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DINING_HALLS } from "../../constants/diningHalls";
import { RES_HALLS } from "../../constants/resHalls";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/context/toastContext";
import { useEffect, useRef } from "react";
import Minimap from "../../components/Minimap";
import { useAuth } from "../../context/AuthContext";
import { PageContainer } from "@/components/layout/PageContainer";

function NewRequest() {
  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");
  const [pickupKey, setPickupKey] = useState("");
  const [dropoffKey, setDropoffKey] = useState("");
  const [customPickup, setCustomPickup] = useState(null);
  const [customDropoff, setCustomDropoff] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const pickupMapRef = useRef(null);
  const dropoffMapRef = useRef(null);
  const { showToast } = useToast();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (pickupKey === "custom" && pickupMapRef.current) {
      pickupMapRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [pickupKey]);

  useEffect(() => {
    if (dropoffKey === "custom" && dropoffMapRef.current) {
      dropoffMapRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [dropoffKey]);

  async function submitReq(e) {
    e.preventDefault();
    let pickupData, dropoffData;

    // Pick up
    if (pickupKey === "custom") {
      if (!customPickup)
        return showToast("Please click a pickup point on the map.", "error");
      pickupData = {
        label: "Custom Pickup",
        lat: customPickup.lat,
        lng: customPickup.lng,
      };
    } else {
      pickupData = DINING_HALLS[pickupKey];
    }

    // Drop off
    if (dropoffKey === "custom") {
      if (!customDropoff)
        return showToast("Please click a dropoff point on the map.", "error");
      dropoffData = {
        label: "Custom Dropoff",
        lat: customDropoff.lat,
        lng: customDropoff.lng,
      };
    } else {
      dropoffData = RES_HALLS[dropoffKey];
    }

    setSubmitting(true);
    const resp = await authFetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item,
        description,
        pickupLocation: pickupData.label,
        pickupLat: pickupData.lat,
        pickupLng: pickupData.lng,
        dropoffLocation: dropoffData.label,
        dropoffLat: dropoffData.lat,
        dropoffLng: dropoffData.lng,
      }),
    });

    if (resp.status === 201) {
      showToast("Request created!", "success");
      setSubmitting(false);
      navigate("/requests");
    } else {
      showToast("Failed to create request", "error");
    }
  }

  return (
    <PageContainer className="flex justify-center">
      <Card className="w-full max-w-lg border-border shadow">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-300 text-2xl">
            Create Delivery Request
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={submitReq} className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium mb-1">Item</p>
              <Input
                value={item}
                maxLength={50}
                onChange={(e) => setItem(e.target.value)}
                required
                className="py-6 text-base"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">Description (Optional)</p>
                <p className="text-xs text-muted-foreground">
                  {description.length}/150
                </p>
              </div>
              <textarea
                value={description}
                maxLength={150}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-input rounded-md p-3 min-h-[100px] resize-y bg-background text-base"
                placeholder="Add details about your request..."
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Pickup</p>
              <select
                value={pickupKey}
                onChange={(e) => setPickupKey(e.target.value)}
                className="w-full border border-input rounded-md p-3 bg-background text-base h-12"
                required
              >
                <option value="" disabled selected></option>
                <option value="custom">Custom Location</option>
                {Object.entries(DINING_HALLS).map(([key, hall]) => (
                  <option key={key} value={key}>
                    {hall.label}
                  </option>
                ))}
              </select>
            </div>

            {pickupKey === "custom" && (
              <div ref={pickupMapRef}>
                <Minimap value={customPickup} onChange={setCustomPickup} />
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-1">Dropoff</p>
              <select
                value={dropoffKey}
                onChange={(e) => setDropoffKey(e.target.value)}
                className="w-full border border-input rounded-md p-3 bg-background text-base h-12"
                required
              >
                <option value="" disabled selected></option>
                <option value="custom">Custom Location</option>
                {Object.entries(RES_HALLS).map(([key, hall]) => (
                  <option key={key} value={key}>
                    {hall.label}
                  </option>
                ))}
              </select>
            </div>

            {dropoffKey === "custom" && (
              <div ref={dropoffMapRef}>
                <Minimap value={customDropoff} onChange={setCustomDropoff} />
              </div>
            )}

            <Button type="submit" className="w-full h-14 text-lg mt-4" disabled={submitting}>
              {submitting ? "Creating..." : "Create Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </PageContainer>
    );
}

export default NewRequest;
