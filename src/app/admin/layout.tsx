import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Admin | Lakewood', template: '%s | Lakewood Admin' },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  return children;
}
