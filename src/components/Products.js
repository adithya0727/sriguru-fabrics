import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Grid, List, Search, Filter } from 'lucide-react';

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  const ITEMS_PER_PAGE = 8;

  const sareeCategories = [
    { id: 'all', label: 'All Sarees', count: '100+' },
    { 
      id: 'gadwal', 
      label: 'Gadwal', 
      priceRange: '₹1,000 - ₹2,700', 
      description: 'Traditional handwoven sarees from Gadwal',
      emoji: '🧵'
    },
    { 
      id: 'ilkal', 
      label: 'Ilkal', 
      priceRange: '₹1,000 - ₹2,000', 
      description: 'Authentic Karnataka heritage sarees',
      emoji: '🎨'
    },
    { 
      id: 'fancy', 
      label: 'Fancy', 
      priceRange: '₹1,000 - ₹2,000', 
      description: 'Contemporary designs for special occasions',
      emoji: '✨'
    },
    { 
      id: 'soft-silk', 
      label: 'Soft Silk', 
      priceRange: '₹1,000 - ₹1,500', 
      description: 'Luxurious silk sarees with elegant finish',
      emoji: '🌟'
    }
  ];

  // Extended sample data - duplicated for demonstration
  const sareeProducts = {
    gadwal: [
      {
        id: 'g1',
        name: 'Traditional Gadwal Silk',
        price: 1300,
        priceDisplay: '₹1,300',
        image: 'https://res.cloudinary.com/dv1scqfyz/image/upload/v1752317698/WhatsApp_Image_2025-07-12_at_15.49.24_inovlc.jpg',
        description: 'Handwoven with traditional motifs',
        blouse: 'with blouse'
      }
    ],
    ilkal: [
      {
        id: 'i1',
        name: 'Classic Ilkal Saree',
        price: 1500,
        priceDisplay: '₹1,500',
        image: 'https://res.cloudinary.com/dv1scqfyz/image/upload/v1752317695/WhatsApp_Image_2025-07-12_at_15.51.41_awgzk2.jpg',
        description: 'Traditional Karnataka weave',
        blouse: 'without blouse'
      }
    ],
    fancy: [
      {
        id: 'f1',
        name: 'Designer Party Saree',
        price: 1400,
        priceDisplay: '₹1,400',
        image: 'https://res.cloudinary.com/dv1scqfyz/image/upload/v1752317700/WhatsApp_Image_2025-07-12_at_15.49.23_bm3yzc.jpg',
        description: 'Perfect for special occasions',
        blouse: 'with blouse'
      }
    ],
    'soft-silk': [
      {
        id: 's1',
        name: 'Pure Soft Silk',
        price: 1500,
        priceDisplay: '₹1,500',
        image: 'https://res.cloudinary.com/dv1scqfyz/image/upload/v1752317698/WhatsApp_Image_2025-07-12_at_15.51.42_f5ig6v.jpg',
        description: 'Luxurious soft silk texture',
        blouse: 'with blouse'
      }
    ]
  };

  // Get filtered and sorted products
  const getFilteredProducts = () => {
    let products = [];
    
    if (selectedCategory === 'all') {
      products = Object.values(sareeProducts).flat();
    } else {
      products = sareeProducts[selectedCategory] || [];
    }

    // Apply search filter
    if (searchTerm) {
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply price filter
    if (priceRange !== 'all') {
      products = products.filter(product => {
        if (priceRange === 'low') return product.price <= 1300;
        if (priceRange === 'medium') return product.price > 1300 && product.price <= 1800;
        if (priceRange === 'high') return product.price > 1800;
        return true;
      });
    }

    // Apply sorting
    products.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return products;
  };

  const filteredProducts = getFilteredProducts();
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, priceRange, sortBy]);

  const ProductCard = ({ product }) => (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-xl ${viewMode === 'list' ? 'flex' : ''}`}>
      <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
        <img 
          src={product.image} 
          alt={product.name}
          className={`object-cover ${viewMode === 'list' ? 'w-full h-full' : 'w-full h-80'}`}
        />
        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
          {product.priceDisplay}
        </div>
      </div>
      <div className="p-4 flex-1">
        <h3 className="text-lg font-bold text-red-800 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-red-600">{product.priceDisplay}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            product.blouse === 'with blouse' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            {product.blouse}
          </span>
        </div>
      </div>
    </div>
  );

  const Pagination = () => (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-white border-2 border-red-600 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50"
      >
        <ChevronLeft size={20} />
      </button>
      
      {[...Array(totalPages)].map((_, index) => (
        <button
          key={index + 1}
          onClick={() => setCurrentPage(index + 1)}
          className={`px-4 py-2 rounded-lg font-medium ${
            currentPage === index + 1
              ? 'bg-red-600 text-white'
              : 'bg-white border-2 border-red-600 text-red-600 hover:bg-red-50'
          }`}
        >
          {index + 1}
        </button>
      ))}
      
      <button
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-white border-2 border-red-600 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-red-800 text-center mb-12">Our Saree Collection</h2>
        
        {/* Search and Controls */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sarees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Filter size={20} />
              Filters
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
          
          {/* Expandable Filters */}
          {showFilters && (
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                >
                  {sareeCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                >
                  <option value="all">All Prices</option>
                  <option value="low">Under ₹1,300</option>
                  <option value="medium">₹1,300 - ₹1,800</option>
                  <option value="high">Above ₹1,800</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                >
                  <option value="name">Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
          </p>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Products Grid/List */}
        <div className={`${viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}`}>
          {currentProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Show message if no products found */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && <Pagination />}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-red-800 mb-4">Ready to Find Your Perfect Saree?</h3>
          <p className="text-gray-600 mb-6">Contact us to discuss your requirements and get personalized recommendations</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:+919663733683" className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors hover:scale-105">
              📞 Call: +91 9663733683
            </a>
            <a href="tel:+919448129415" className="border-2 border-red-600 text-red-600 px-8 py-3 rounded-lg hover:bg-red-600 hover:text-white transition-colors hover:scale-105">
              📞 Call: +91 9448129415
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
