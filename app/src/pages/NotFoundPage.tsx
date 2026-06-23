import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-serif text-[15vw] sm:text-[10vw] lg:text-[8vw] leading-none mb-4">404</h1>
        <p className="text-gray-400 text-sm tracking-wide mb-2">PAGE NOT FOUND</p>
        <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors"
        >
          <ArrowLeft size={14} />
          BACK TO HOME
        </Link>
      </div>
    </main>
  );
}
