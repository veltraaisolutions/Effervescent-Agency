import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-radial-gradient from-[#FDB8D7]/5 to-transparent pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <h1 className="text-3xl font-light tracking-widest text-white uppercase">
          <span className="text-[#FDB8D7] font-bold">Effervescent</span> Agency
        </h1>

        <div className="pt-2">
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] mb-1">
            Developed By
          </p>
          {/* Your name as the link */}
          <Link
            href="https://zeeshan.veltraai.net/"
            target="_blank"
            className="text-xl font-medium text-white hover:text-[#FDB8D7] transition-all duration-300 decoration-[#FDB8D7]/30 underline-offset-8 hover:underline"
          >
            Zeeshan Mukhtar
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-8 text-[9px] text-gray-800 uppercase tracking-widest">
        Veltra AI Sollutions
      </footer>
    </main>
  );
}
