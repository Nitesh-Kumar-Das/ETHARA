import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Team Task Manager",
  description: "Production-ready team task management with role-based access control",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(240, 243, 250, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(177, 201, 239, 0.6)",
                color: "#1e2d45",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(57, 88, 134, 0.15)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
              },
              success: {
                iconTheme: { primary: "#628ECB", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#e05555", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
