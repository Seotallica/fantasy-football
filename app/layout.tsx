import type { Metadata } from "next";
import "./styles.css";
export const metadata: Metadata = {
  title: "Seotallica | Fantasy Intelligence",
  description: "Personal Yahoo Fantasy Football intelligence dashboard"
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
