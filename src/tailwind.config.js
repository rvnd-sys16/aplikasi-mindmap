/** @type {import('tailwindcss').Config} */
export default {
  // Bagian ini sangat penting agar Tailwind tahu file mana saja yang harus didesain
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}", // Memindai file di root folder seperti MindMap.jsx
  ],
  theme: {
    extend: {
      // Anda bisa menambahkan kustomisasi warna atau font di sini nanti
    },
  },
  plugins: [],
}
