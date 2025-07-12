import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    sareeType: '',
    message: ''
  });

  const contacts = [
    { name: "V Balagopal", phone: "+91 9902963167", emoji: "👨‍💼" },
    { name: "Sandhya B", phone: "+91 9663733683", emoji: "👩‍💼" },
    { name: "Rama Sudhakar", phone: "+91 9980016054", emoji: "👨‍💼" }
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
    const whatsappUrl = `https://wa.me/919902963167?text=${encodeURIComponent(message)}`;
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
                      <a href={`tel:${contact.phone}`} className="text-gray-600 hover:text-red-600 transition-colors">
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
                <label className="block text
