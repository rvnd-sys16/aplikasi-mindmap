import React from 'react';
import '../src/index.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  // Hanya menampilkan isi halaman tanpa sidebar/menu bawaan
  return <>{children}</>;
}