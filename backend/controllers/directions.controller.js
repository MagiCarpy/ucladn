import asyncHandler from "express-async-handler";
import axios from "axios";

const PROFILE = "foot-walking";

export const getDirections = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res
      .status(400)
      .json({ message: "Missing required query params: from, to" });
  }

  const [fromLat, fromLng] = from.split(",").map(Number);
  const [toLat, toLng] = to.split(",").map(Number);

  try {
    const resp = await axios.post(
      `https://api.openrouteservice.org/v2/directions/${PROFILE}/geojson`,
      {
        coordinates: [
          [fromLng, fromLat],
          [toLng, toLat],
        ],
      },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    const feature = resp.data.features[0];
    const geometry = feature.geometry.coordinates;
    const polyline = geometry.map(([lng, lat]) => [lat, lng]);

    const summary = feature.properties?.summary || {};
    const distance = summary.distance;
    const duration = summary.duration;

    return res.status(200).json({ polyline, distance, duration });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch directions" });
  }
});
