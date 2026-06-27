import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Truck, RotateCcw, Ruler, Check } from 'lucide-react';
import { useProductStore } from '@/stores/useProductStore';
import { formatNaira } from '@/config';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'size-guide' | 'shipping' | 'care'>('description');
  const [isWishlisted, setIsWishlisted] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const products = useProductStore((s) => s.products);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const isElite = user?.membershipTier === 'elite';

  useEffect(() => { if (products.length === 0) fetchProducts(); }, [products.length, fetchProducts]);
  const product = products.find((p) => p.slug === slug);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[1] || product.sizes[0]);
      setActiveImage(0);
      setQuantity(1);
    }
    window.scrollTo(0, 0);
  }, [slug, product]);

  if (!product) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-4">Product Not Found</h1>
          <Link to="/shop" className="text-xs tracking-[0.15em] underline">BACK TO SHOP</Link>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast('Please select a size', 'error');
      return;
    }
    addItem(product, selectedSize, quantity);
    showToast(`${product.name} added to cart`, 'success');
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    showToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'info');
  };

  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const tabs = [
    { key: 'description' as const, label: 'Description' },
    { key: 'size-guide' as const, label: 'Size Guide' },
    { key: 'shipping' as const, label: 'Shipping & Returns' },
    { key: 'care' as const, label: 'Care' },
  ];

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 lg:px-12 py-4">
        <div className="flex items-center gap-2 text-[11px] tracking-wide text-gray-400">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-black transition-colors">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-black transition-colors">{product.category}</Link>
          <span>/</span>
          <span className="text-black">{product.name}</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div>
            <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-4">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-24 overflow-hidden border-2 transition-colors ${
                      activeImage === i ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:py-8">
            <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase">{product.category} — {product.fit} Fit</p>
            <h1 className="font-serif text-3xl sm:text-4xl mt-3 mb-4">{product.name}</h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-semibold">{formatNaira(product.price)}</span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through">{formatNaira(product.originalPrice)}</span>
              )}
              {product.originalPrice && (
                <span className="px-2 py-1 bg-black text-white text-[9px] tracking-[0.1em]">
                  SAVE {formatNaira(product.originalPrice - product.price)}
                </span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>

            {/* Size Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] tracking-[0.15em] font-semibold uppercase">Size</span>
                <button
                  onClick={() => setActiveTab('size-guide')}
                  className="text-[10px] tracking-[0.1em] text-gray-400 flex items-center gap-1 hover:text-black transition-colors"
                >
                  <Ruler size={12} /> SIZE GUIDE
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 border text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? 'bg-black text-white border-black'
                        : 'border-gray-200 text-gray-600 hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <span className="text-[10px] tracking-[0.15em] font-semibold uppercase block mb-3">Quantity</span>
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 border flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  −
                </button>
                <span className="w-12 h-12 border-t border-b flex items-center justify-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 border flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock indicator */}
            {product.stock <= 0 ? (
              <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-[10px] uppercase tracking-[0.15em] text-red-700 font-semibold inline-block">Out of stock</div>
            ) : product.stock <= (product.lowStockThreshold ?? 5) ? (
              <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 text-[10px] uppercase tracking-[0.15em] text-amber-800 font-semibold inline-block">Only {product.stock} left</div>
            ) : null}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 py-4 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {product.stock <= 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
              </button>
              <button
                onClick={handleWishlist}
                className={`w-14 h-14 border flex items-center justify-center transition-colors ${
                  isWishlisted ? 'bg-black text-white border-black' : 'hover:border-black'
                }`}
              >
                <Heart size={18} className={isWishlisted ? 'fill-white' : ''} />
              </button>
            </div>

            {/* Bespoke CTA for Elite */}
            {isElite && (
              <button
                onClick={() => useUIStore.getState().openModal('chat')}
                className="w-full py-3 border border-black text-xs tracking-[0.15em] font-semibold hover:bg-black hover:text-white transition-colors mb-8"
              >
                REQUEST CUSTOM FIT
              </button>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-t border-b">
              {[
                { icon: Truck, label: 'Standard Delivery', sub: '₦2,500' },
                { icon: RotateCcw, label: 'Easy Returns', sub: '30 Days' },
                { icon: Check, label: 'Premium Quality', sub: 'Guaranteed' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="text-center">
                  <Icon size={18} strokeWidth={1.5} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-[10px] tracking-[0.1em] font-medium">{label}</p>
                  <p className="text-[10px] text-gray-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16 lg:mt-24">
          <div className="flex gap-6 border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-4 text-xs tracking-[0.15em] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="py-8 max-w-3xl">
            {activeTab === 'description' && (
              <div className="text-gray-600 leading-relaxed space-y-4">
                <p>{product.description}</p>
                <p>{product.details?.material}</p>
              </div>
            )}
            {activeTab === 'size-guide' && (
              <div className="text-gray-600">
                <p className="mb-4">{product.details?.sizeGuide}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 pr-6 text-xs tracking-[0.1em]">SIZE</th>
                        <th className="text-left py-3 pr-6 text-xs tracking-[0.1em]">CHEST (IN)</th>
                        <th className="text-left py-3 pr-6 text-xs tracking-[0.1em]">WAIST (IN)</th>
                        <th className="text-left py-3 text-xs tracking-[0.1em]">LENGTH (IN)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['S', '36-38', '30-32', '28'],
                        ['M', '38-40', '32-34', '29'],
                        ['L', '40-42', '34-36', '30'],
                        ['XL', '42-44', '36-38', '31'],
                        ['XXL', '44-46', '38-40', '32'],
                      ].map(([size, chest, waist, length]) => (
                        <tr key={size} className="border-b border-gray-100">
                          <td className="py-3 pr-6 font-medium">{size}</td>
                          <td className="py-3 pr-6">{chest}</td>
                          <td className="py-3 pr-6">{waist}</td>
                          <td className="py-3">{length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="text-gray-600 leading-relaxed">
                <p>{product.details?.shipping}</p>
                <p className="mt-4">All orders are processed within 1-2 business days. You will receive a tracking number once your order ships.</p>
              </div>
            )}
            {activeTab === 'care' && (
              <div className="text-gray-600 leading-relaxed">
                <p>{product.details?.care}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 lg:mt-24">
            <h2 className="font-serif text-2xl sm:text-3xl mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((rp) => (
                <Link key={rp.id} to={`/shop/${rp.slug}`} className="group">
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100 img-zoom">
                    <img src={rp.images[0]} alt={rp.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-medium truncate">{rp.name}</h3>
                    <p className="text-sm font-semibold mt-1">{formatNaira(rp.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
