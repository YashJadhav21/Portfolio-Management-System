import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/store/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Portfolio Management System",
  description: "Professional portfolio management for investors, mutual funds, FDs, and shares.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0f172a",
                border: "1px solid #1e293b",
                color: "#f8fafc",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
