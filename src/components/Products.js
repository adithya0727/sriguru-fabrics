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
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 hover-scale ${
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sareeCategories.slice(1).map((category) => (
            <div key={category.id} className={`bg-white rounded-xl shadow-lg overflow-hidden hover-scale transition-all duration-300 ${
              selectedCategory !== 'all' && selectedCategory !== category.id ? 'opacity-50' : ''
            }`}>
              <div className="h-64 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">{category.emoji}</div>
                  <p className="text-red-700 font-semibold">{category.label} Sarees</p>
                  <p className="text-sm text-gray-600">Premium Quality Collection</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-red-800 mb-2">{category.label} Sarees</h3>
                <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-red-600">{category.priceRange}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-red-800 mb-4">Ready to Find Your Perfect Saree?</h3>
          <p className="text-gray-600 mb-6">Contact us to discuss your requirements and get personalized recommendations</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:+919663733683" className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors hover-scale">
              📞 Call: +91 9663733683
            </a>
            <a href="tel:+919448129415" className="border-2 border-red-600 text-red-600 px-8 py-3 rounded-lg hover:bg-red-600 hover:text-white transition-colors hover-scale">
              📞 Call: +91 9448129415
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
