import React from 'react';

const Hero = ({ scrollToSection }) => {
  return (
    <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="mb-8">
            <div className="mx-auto w-32 h-32 rounded-full shadow-lg border-4 border-red-600 overflow-hidden bg-red-50">
              <img 
                src="https://res.cloudinary.com/dv1scqfyz/image/upload/v1752305220/now_r0w5by.jpg" 
                alt="Sri Guru Raghavendra Fabrics Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center text-white" style={{display: 'none'}}>
                <div className="text-center">
                  <div className="text-2xl font-bold">SRG</div>
                  <div className="text-xs">LOGO</div>
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-red-800 mb-6 fade-in">
            Sri Guru Raghavendra Fabrics
          </h1>
          <p className="text-xl md:text-2xl text-red-700 mb-8 max-w-4xl mx-auto slide-up">
            Authentic Sarees at Affordable Prices - Celebrating 15+ Years of Trust & Quality
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button 
              onClick={() => scrollToSection('products')}
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 hover-scale shadow-lg"
            >
              🛍️ Shop Now
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 hover-scale"
            >
              Our Story
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg slide-up">
            <div className="text-4xl mb-4">⏰</div>
            <div className="text-3xl font-bold text-red-800">15+</div>
            <div className="text-red-600 font-semibold">Years Experience</div>
          </div>
          <div className="text-center bg-white p-8 rounded-xl shadow-lg slide-up">
            <div className="text-4xl mb-4">👥</div>
            <div className="text-3xl font-bold text-red-800">15000+</div>
            <div className="text-red-600 font-semibold">Happy Customers</div>
          </div>
          <div className="text-center bg-white p-8 rounded-xl shadow-lg slide-up">
            <div className="text-4xl mb-4">🏆</div>
            <div className="text-3xl font-bold text-red-800">100%</div>
            <div className="text-red-600 font-semibold">Authentic Quality</div>
          </div>
        </div>

        {/* Values */}
        <div className="bg-white rounded-2xl shadow-xl p-8 slide-up">
          <h2 className="text-3xl font-bold text-red-800 text-center mb-8">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-semibold text-red-800 mb-2">Authenticity</h3>
              <p className="text-gray-600 text-sm">Sourcing from diverse manufacturers, celebrating real craftsmanship</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold text-red-800 mb-2">Affordability</h3>
              <p className="text-gray-600 text-sm">Making beautiful sarees accessible to everyone</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="font-semibold text-red-800 mb-2">Community</h3>
              <p className="text-gray-600 text-sm">Building lasting relationships with our customers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="font-semibold text-red-800 mb-2">Trust</h3>
              <p className="text-gray-600 text-sm">Creating a shopping experience that feels like home</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
