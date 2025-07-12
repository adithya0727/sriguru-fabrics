import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About Us', href: '#about' },
    { name: 'Products', href: '#products' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' }
  ];

  const sareeTypes = [
    'Gadwal Sarees',
    'Ilkal Sarees',
    'Fancy Sarees',
    'Soft Silk Sarees',
    'Custom Orders'
  ];

  const contactInfo = [
    { type: 'address', icon: '📍', text: 'Chikkalasandra, Bangalore - 560061' },
    { type: 'phone', icon: '📞', text: '+91 9902963167' },
    { type: 'phone', icon: '📞', text: '+91 9663733683' },
    { type: 'phone', icon: '📞', text: '+91 9980016054' },
    { type: 'hours', icon: '🕒', text: 'Mon-Sat: 10AM-8PM, Sun: 10AM-6PM' }
  ];

  const handleLinkClick = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-red-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full mr-3 border-2 border-red-300 overflow-hidden bg-red-50">
                <img 
                  src="https://res.cloudinary.com/dv1scqfyz/image/upload/v1752305220/now_r0w5by.jpg" 
                  alt="Sri Guru Raghavendra Fabrics Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white text-sm font-bold">SRG</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-200">Sri Guru Raghavendra</h3>
                <p className="text-red-300 text-sm">Fabrics</p>
              </div>
            </div>
            <p className="text-red-100 mb-4 text-sm leading-relaxed">
              Authentic sarees at affordable prices. Celebrating 15+ years of trust, quality, and dedication to preserving India's rich textile heritage.
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-red-300">❤️</span>
              <span className="text-red-200 text-sm">Made with love in Bangalore</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-red-200">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleLinkClick(link.href)}
                    className="text-red-100 hover:text-white transition-colors duration-300 text-sm hover:underline"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Collection */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-red-200">Our Collection</h4>
            <ul className="space-y-2">
              {sareeTypes.map((type, index) => (
                <li key={index} className="text-red-100 text-sm flex items-center">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                  {type}
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-red-800 rounded-lg">
              <p className="text-red-200 text-xs">
                <strong>💰 Price Range:</strong> ₹1,000 - ₹2,700
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-red-200">Contact Info</h4>
            <div className="space-y-3">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="text-lg">{info.icon}</span>
                  <div>
                    {info.type === 'phone' ? (
                      <a 
                        href={`tel:${info.text}`}
                        className="text-red-100 hover:text-white transition-colors text-sm"
                      >
                        {info.text}
                      </a>
                    ) : (
                      <span className="text-red-100 text-sm">{info.text}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-t border-red-800 mt-8 pt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-red-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-200">15+</div>
              <div className="text-red-300 text-sm">Years Experience</div>
            </div>
            <div className="bg-red-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-200">200+</div>
              <div className="text-red-300 text-sm">Happy Customers</div>
            </div>
            <div className="bg-red-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-200">100%</div>
              <div className="text-red-300 text-sm">Authentic Quality</div>
            </div>
            <div className="bg-red-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-200">4.9★</div>
              <div className="text-red-300 text-sm">Customer Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-red-800 bg-red-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-red-200 text-sm">
              &copy; {currentYear} Sri Guru Raghavendra Fabrics. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-red-200 text-sm">
              <span>🌟 Trusted Since 2009</span>
              <span>•</span>
              <span>🚚 Home Delivery Available</span>
              <span>•</span>
              <span>💬 WhatsApp Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://wa.me/919902963167?text=Hello! I'm interested in your sarees."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
          title="Chat with us on WhatsApp"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.488"/>
          </svg>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
