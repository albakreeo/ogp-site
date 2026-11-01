import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "OGP — Online Growth Partner | شريك النمو الرقمي",
  description:
    "Digital performance agency in Riyadh: tracking, paid ads, SEO, CRO, websites and apps. وكالة أداء رقمي متخصصة في هندسة النمو والتسويق الموجه بالبيانات.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Noto+Kufi+Arabic:wght@600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
