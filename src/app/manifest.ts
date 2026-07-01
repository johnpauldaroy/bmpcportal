import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BMPC Portal",
    short_name: "BMPC",
    description: "Member and admin portal for Barbaza Multi-Purpose Cooperative.",
    start_url: "/member",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#3673FC",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  };
}
