import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Home } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { useProductStore } from '@/stores/useProductStore';
import { formatNaira } from '@/config';

export default function NotFoundPage() {
  const products = useProductStore((s) => s.products);
  const featured = (products.length > 0 ? products : []).slice(0, 3);

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero / 404 panel */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24 bg-[#f0f3f5] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={BRAND.assets.crest}
            alt=""
            className="h-3/4 w-auto opacity-[0.07]"
          />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <img
            src={BRAND.assets.crest}
            alt={`${BRAND.name} crest`}
            className="h-16 w-auto mx-auto mb-8 opacity-80"
          />
          <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase mb-3">Error 404</p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl mb-4">Page Not Found</h1>
          <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed mb-8">
            The page you are looking for does not exist, has been moved, or is temporarily
            unavailable. Let us help you find your way back.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white text-xs tracking-[0.2em] font-medium hover:bg-black/80 transition-colors"
            >
              <Home size={14} />
              GO HOME
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-3 border border-black text-black text-xs tracking-[0.2em] font-medium hover:bg-black hover:text-white transition-colors"
            >
              <ShoppingBag size={14} />
              SHOP COLLECTION
            </Link>
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3">
                In the meantime
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl">Explore the Collection</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {featured.map((product) => (
                <Link
                  key={product.id}
                  to={`/shop/${product.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.isNew && (
                      <span className="absolute top-3 left-3 px-2 py-1 bg-black text-white text-[9px] tracking-[0.2em]">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold">{formatNaira(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatNaira(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-xs tracking-[0.2em] underline underline-offset-4 hover:opacity-60 transition-opacity"
              >
                VIEW ALL PRODUCTS <ArrowLeft size={12} className="rotate-180" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
