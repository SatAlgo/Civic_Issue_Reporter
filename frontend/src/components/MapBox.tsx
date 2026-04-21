// import React, { useEffect, useRef } from "react";
// import mapboxgl from "mapbox-gl";
// import "mapbox-gl/dist/mapbox-gl.css";

// mapboxgl.accessToken = import.meta.env.VITE_MAPBOXGL_ACCESS_TOKEN;

// interface MapComponentProps {
//   onLocationSelect: (lat: number, lng: number, address: string) => void;
// }

// const MapComponent: React.FC<MapComponentProps> = ({ onLocationSelect }) => {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const markerRef = useRef<mapboxgl.Marker | null>(null);
//   const mapRef = useRef<mapboxgl.Map | null>(null);

//   useEffect(() => {
//     if (!mapContainer.current) return;

//     // Initialize map
//     mapRef.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: "mapbox://styles/mapbox/streets-v12",
//       center: [77.757218, 20.932185], // Default: Bangalore (lng, lat)
//       zoom: 12,
//     });

//     // Change cursor on hover over map
//     mapRef.current.on("mouseenter", () => {
//       mapRef.current!.getCanvas().style.cursor = "crosshair"; // Change cursor on map hover
//     });
//     mapRef.current.on("mouseleave", () => {
//       mapRef.current!.getCanvas().style.cursor = "";
//     });

//     mapRef.current.on("click", async (e) => {
//       const { lng, lat } = e.lngLat;

//       // Update or create the marker - make it draggable
//       if (markerRef.current) {
//         markerRef.current.setLngLat([lng, lat]);
//       } else {
//         markerRef.current = new mapboxgl.Marker({ draggable: true })
//           .setLngLat([lng, lat])
//           .addTo(mapRef.current!);

//         // Change cursor while dragging marker
//         markerRef.current.on("dragstart", () => {
//           if (mapRef.current)
//             mapRef.current.getCanvas().style.cursor = "grabbing";
//         });

//         markerRef.current.on("dragend", async () => {
//           if (mapRef.current)
//             mapRef.current.getCanvas().style.cursor = "crosshair";

//           const lngLat = markerRef.current!.getLngLat();
//           const address = await reverseGeocode(lngLat.lng, lngLat.lat);
//           onLocationSelect(lngLat.lat, lngLat.lng, address);
//         });
//       }

//       // Reverse geocode for address:
//       const resp = await fetch(
//         `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
//       );
//       const data = await resp.json();
//       const address =
//         data.features && data.features[0]
//           ? data.features[0].place_name
//           : `Lat: ${lat}, Lng: ${lng}`;

//       onLocationSelect(lat, lng, address);
//     });

//     // Cleanup on unmount
//     return () => {
//       mapRef.current?.remove();
//       mapRef.current = null;
//       markerRef.current = null;
//     };
//   }, [onLocationSelect]);

//   async function reverseGeocode(lng: number, lat: number) {
//     try {
//       const res = await fetch(
//         `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
//       );
//       const data = await res.json();
//       return data.features && data.features[0]
//         ? data.features[0].place_name
//         : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//     } catch {
//       return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//     }
//   }

//   return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
// };

// export default MapComponent;


import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapComponentProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onLocationSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map centered on Nagpur/Maharashtra
    mapRef.current = L.map(mapContainer.current).setView([20.932185, 77.757218], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);

    mapRef.current.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current!);

        markerRef.current.on("dragend", async () => {
          const pos = markerRef.current!.getLatLng();
          const address = await reverseGeocode(pos.lat, pos.lng);
          onLocationSelect(pos.lat, pos.lng, address);
        });
      }

      const address = await reverseGeocode(lat, lng);
      onLocationSelect(lat, lng, address);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
};

export default MapComponent;