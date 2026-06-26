import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
// useSearchParams is used via searchParams read
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { formatNaira } from '@/config';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import { useProductStore } from '@/stores/useProductStore';

const CATEGORIES = ['All', 'Suits', 'Blazers', 'Trousers', 'Vests', 'Formal', 'Outerwear'];
const FITS = ['All', 'Oversized', 'Tailored', 'Classic', 'Slim'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [fit, setFit] = useState('All');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(1);

  const addItem = useCartStore((s) => s.addItem);
  const showToast = useUIStore((s) => s.showToast);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const products = useProductStore((s) => s.products);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const ITEMS_PER_PAGE = 8;

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (category !== 'All') {
      result = result.filter((p) => p.category === category);
    }
    if (fit !== 'All') {
      result = result.filter((p) => p.fit === fit);
    }
    if (selectedSizes.length > 0) {
      result = result.filter((p) => selectedSizes.some((s) => p.sizes.includes(s)));
    }
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }

    return result;
  }, [category, fit, selectedSizes, priceRange, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setCategory('All');
    setFit('All');
    setSelectedSizes([]);
    setPriceRange([0, 500000]);
    setCurrentPage(1);
  };

  const activeFilterCount = [
    category !== 'All',
    fit !== 'All',
    selectedSizes.length > 0,
    priceRange[0] > 0 || priceRange[1] < 500000,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Shop Hero */}
      <section className="relative w-full h-[40vh] sm:h-[50vh] bg-black flex items-center justify-center overflow-hidden">
        <img
          src="/images/community/event-1.jpg"
          alt="Collection"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 text-center px-4">
          <p className="text-white/50 text-[10px] tracking-[0.3em] uppercase mb-3">Winter 2025</p>
          <h1 className="font-serif text-white text-4xl sm:text-5xl lg:text-6xl">THE COLLECTION</h1>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border text-xs tracking-[0.1em]"
            >
              <SlidersHorizontal size={14} />
              FILTERS {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border text-xs tracking-[0.1em] bg-white focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Filters Sidebar */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-24 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xs tracking-[0.15em] font-semibold">FILTERS</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-[10px] tracking-[0.1em] text-gray-400 hover:text-black flex items-center gap-1">
                    <X size={10} /> CLEAR
                  </button>
                )}
              </div>

              {/* Category */}
              <div>
                <h4 className="text-[10px] tracking-[0.15em] text-gray-400 mb-3 uppercase">Category</h4>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setCurrentPage(1); }}
                      className={`block text-sm transition-colors ${category === cat ? 'text-black font-medium' : 'text-gray-400 hover:text-black'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fit */}
              <div>
                <h4 className="text-[10px] tracking-[0.15em] text-gray-400 mb-3 uppercase">Fit</h4>
                <div className="space-y-2">
                  {FITS.map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFit(f); setCurrentPage(1); }}
                      className={`block text-sm transition-colors ${fit === f ? 'text-black font-medium' : 'text-gray-400 hover:text-black'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <h4 className="text-[10px] tracking-[0.15em] text-gray-400 mb-3 uppercase">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`w-9 h-9 border text-xs font-medium transition-colors ${
                        selectedSizes.includes(size)
                          ? 'bg-black text-white border-black'
                          : 'border-gray-200 text-gray-500 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-[10px] tracking-[0.15em] text-gray-400 mb-3 uppercase">Price Range</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="500000"
                    step="10000"
                    value={priceRange[1]}
                    onChange={(e) => { setPriceRange([0, Number(e.target.value)]); setCurrentPage(1); }}
                    className="w-full accent-black"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>₦0</span>
                    <span>₦{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Desktop sort bar */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <p className="text-sm text-gray-400">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </p>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 border text-xs tracking-[0.1em] bg-white focus:outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {paginatedProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 mb-4">No products match your filters.</p>
                <button onClick={clearFilters} className="text-xs tracking-[0.1em] underline">Clear all filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {paginatedProducts.map((product) => (
                  <div key={product.id} className="group">
                    <Link to={`/shop/${product.slug}`} className="block">
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 img-zoom">
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        <img
                          src={product.images[1] || product.images[0]}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        />
                        {product.isNew && (
                          <span className="absolute top-3 left-3 px-2 py-1 bg-black text-white text-[9px] tracking-[0.15em]">NEW</span>
                        )}
                        {/* Quick Add */}
                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              addItem(product, product.sizes[1] || product.sizes[0]);
                              showToast(`${product.name} added to cart`, 'success');
                            }}
                            className="w-full py-2.5 bg-black text-white text-[10px] tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors"
                          >
                            QUICK ADD
                          </button>
                        </div>
                      </div>
                    </Link>
                    <div className="mt-4">
                      <p className="text-[10px] tracking-[0.1em] text-gray-400 uppercase">{product.category}</p>
                      <h3 className="text-sm font-medium mt-1 truncate">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold">{formatNaira(product.price)}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">{formatNaira(product.originalPrice)}</span>
                        )}
                      </div>
                      {/* Color swatches */}
                      <div className="flex gap-1.5 mt-2">
                        {product.colors.map((color) => (
                          <span
                            key={color}
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: color.toLowerCase() === 'black' ? '#1a1a1a' : color.toLowerCase() === 'white' ? '#f5f5f5' : color.toLowerCase() === 'charcoal' ? '#4a4a4a' : color.toLowerCase() === 'navy' ? '#1a1a3e' : color.toLowerCase() === 'gray' ? '#888' : '#ccc' }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-10 h-10 text-xs font-medium transition-colors ${
                      currentPage === i + 1 ? 'bg-black text-white' : 'border hover:border-black'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
