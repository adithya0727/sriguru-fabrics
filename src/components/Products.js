import React, { useState } from 'react';

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  // Sample saree data with images and prices
  const sareeProducts = {
    gadwal: [
      {
        id: 'g1',
        name: 'Traditional Gadwal Silk',
        price: '₹1,300',
        image: 'https://res.cloudinary.com/dv1scqfyz/image/upload/v1752317698/WhatsApp_Image_2025-07-12_at_15.49.24_inovlc.jpg',
        description: 'Handwoven with traditional motifs'
      }
    ],
    ilkal: [
      {
        id: 'i1',
        name: 'Classic Ilkal Saree',
        price: '₹1,500',
        image: 'https://res.cloudinary.com/dv1scqfyz/image/upload/v1752317695/WhatsApp_Image_2025-07-12_at_15.51.41_awgzk2.jpg',
        description: 'Traditional Karnataka weave'
      }
    ],
    fancy: [
      {
        id: 'f1',
        name: 'Designer Party Saree',
        price: '₹1,400',
        image: 'https://res.cloudinary.com/dv1scqfyz/image/upload/v1752317700/WhatsApp_Image_2025-07-12_at_15.49.23_bm3yzc.jpg',
        description: 'Perfect for special occasions'
      }
    ],
    'soft-silk': [
      {
        id: 's1',
        name: 'Pure Soft Silk',
        price: '₹1,500',
        image: 'https://res.cloudinary.com/dv1scqfyz/image/upload/v1752317698/WhatsApp_Image_2025-07-12_at_15.51.42_f5ig6v.jpg',
        description: 'Luxurious soft silk texture'
      }
    ]
  };

  // Get filtered products
  const getFilteredProducts = () => {
    if (selectedCategory === 'all') {
      return Object.values(sareeProducts).flat();
    }
    return sareeProducts[selectedCategory] || [];
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-red-800 text-center mb-12">Our Saree Collection</h2>
        
        {/* Filter Section */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <span className="text-2xl mr-3">🔍</span>
            <h3 className="text-xl font-semibold text-red-700">Filter by Category</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {sareeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-50'
                }`}
              >
                {category.label}
                {category.count && <span className="ml-2 text-sm">({category.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-xl">
              <div className="relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-80 object-cover"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {product.price}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-red-800 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-red-600">{product.price}</span>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show message if no products found */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found for the selected category.</p>
          </div>
        )}

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
