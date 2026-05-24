import "./globals.css";

export const metadata = {
  title: "ARICT Past Paper Portal",
  description:
    "Search through thousands of past examination papers, meticulously organized by department and paper for ARICT students. Association of Rajarata Information & Communication Technology.",
  keywords: [
    "ARICT",
    "past papers",
    "examination",
    "university",
    "Rajarata",
    "ICT",
    "computer science",
  ],
  openGraph: {
    title: "ARICT Past Paper Portal",
    description:
      "Access years of academic excellence. Search past examination papers organized by department and paper.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
