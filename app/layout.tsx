export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0A0B0F" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
