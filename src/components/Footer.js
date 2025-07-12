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
    { type: 'phone', icon: '📞', text: '+91 9663733683' },
    { type: 'phone', icon: '📞', text: '+91 9448129415' },
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
              <div className="text-2xl font-bold text-red-200">500+</div>
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
      <div style={{position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999}}>
        <a
          href="https://wa.me/919663733683?text=Hello! I'm interested in your sarees."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-300"
          title="Chat with us on WhatsApp"
          style={{
            display: 'block',
            width: '50px',
            height: '50px',
            padding: '10px',
            textAlign: 'center',
            lineHeight: '30px'
          }}
        >
          <svg style={{width: '30px', height: '30px', verticalAlign: 'middle'}} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 2.079.549 4.03 1.592 5.71L0 24l6.573-1.727a11.9 11.9 0 005.444 1.344c6.621 0 11.988-5.367 11.988-11.987C23.971 5.367 18.638.029 12.017 0zm.058 21.925h-.004a9.94 9.94 0 01-5.068-1.388L5.35 19.49l-3.177.833.85-3.102-1.083-1.652a9.935 9.935 0 01-1.517-5.582c0-5.496 4.477-9.973 9.973-9.973 2.663 0 5.168 1.038 7.055 2.925 1.887 1.887 2.925 4.392 2.925 7.055-.004 5.496-4.481 9.973-9.978 9.973z"/>
          </svg>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
