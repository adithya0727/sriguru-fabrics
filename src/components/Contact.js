import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    sareeType: '',
    message: ''
  });

  const contacts = [
    { name: "Sandhya B", phone: "+91 9663733683", emoji: "👩‍💼" },
    { name: "V Balagopal", phone: "+91 9448129415", emoji: "👨‍💼" },
    { name: "Rama Sudhakar", phone: "+91 9980016054", emoji: "👩‍💼" }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Create WhatsApp message
    const message = `Hello! I'm interested in your sarees.\n\nName: ${formData.name}\nPhone: ${formData.phone}\nSaree Type: ${formData.sareeType}\nMessage: ${formData.message}`;
    const whatsappUrl = `https://wa.me/919663733683?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-red-800 text-center mb-12">Contact Us</h2>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-red-700 mb-6">Get In Touch</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="text-2xl">📍</span>
                <div>
                  <h4 className="font-semibold text-red-800">Visit Our Store</h4>
                  <p className="text-gray-600">
                    No.3, Puja Classic Apartments<br />
                    Doctors Colony, Shima Layout<br />
                    Chikkalasandra, Near Shani Temple<br />
                    Bangalore - 560061
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-red-800 mb-4">📞 Contact Numbers</h4>
                {contacts.map((contact, index) => (
                  <div key={index} className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xl">{contact.emoji}</span>
                    <div>
                      <p className="font-medium text-red-700">{contact.name}</p>
                      <a 
                        href={`tel:${contact.phone}`} 
                        className="text-gray-600 hover:text-red-600 transition-colors"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-red-800 mb-4">🕒 Business Hours</h4>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Monday - Saturday:</strong> 10:00 AM - 8:00 PM</p>
                  <p><strong>Sunday:</strong> 10:00 AM - 6:00 PM</p>
                  <p><strong>Festivals:</strong> Call for timings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-red-700 mb-6">Send Us a Message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saree Type Interest
                </label>
                <select
                  name="sareeType"
                  value={formData.sareeType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select saree type</option>
                  <option value="Gadwal Sarees">Gadwal Sarees</option>
                  <option value="Ilkal Sarees">Ilkal Sarees</option>
                  <option value="Fancy Sarees">Fancy Sarees</option>
                  <option value="Soft Silk Sarees">Soft Silk Sarees</option>
                  <option value="All Types">All Types</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  placeholder="Tell us about your requirements, preferred colors, occasion, or any specific questions..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors transform hover:scale-105 font-medium"
              >
                💬 Send via WhatsApp
              </button>
            </form>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>📱 Quick Connect:</strong> Your message will open WhatsApp for instant communication with our team!
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-red-800 text-center mb-6">Why Choose Us?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="font-semibold text-red-700 mb-2">Quick Response</h4>
              <p className="text-gray-600">We respond to all inquiries within 2 hours during business hours</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h4 className="font-semibold text-red-700 mb-2">15+ Years Experience</h4>
              <p className="text-gray-600">Trusted by 500+ customers across Karnataka</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💝</div>
              <h4 className="font-semibold text-red-700 mb-2">Personal Service</h4>
              <p className="text-gray-600">Each customer receives personalized attention and care</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
