import './globals.css';

export const metadata = {
  title: 'Bitcoin Lottery - Mine Real Bitcoin in Your Browser',
  description: 'A for-fun Bitcoin mining lottery with terrible odds. Mine real Bitcoin blocks in your browser with 1000 hashes per click.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}