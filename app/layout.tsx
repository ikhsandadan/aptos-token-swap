import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

import Header from "./(components)/Header";
import Footer from "./(components)/Footer";
import { AppContext } from "./(components)/AppContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aptos Token Swap",
  description: "Created by Nashki",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppContext>
          <Header />
          {children}
          <Footer />
        </AppContext>
      </body>
    </html>
  );
}
