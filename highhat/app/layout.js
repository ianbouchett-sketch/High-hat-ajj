export const metadata = {
  title: 'High Hat American Jiu Jitsu',
  description: 'Gym management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#060606' }}>
        {children}
      </body>
    </html>
  );
}
