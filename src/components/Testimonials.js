import React from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Priya Sharma",
      rating: 5,
      comment: "Amazing quality sarees at unbeatable prices! The Gadwal saree I bought is absolutely beautiful and the service was exceptional.",
      location: "Bangalore",
      emoji: "😊"
    },
    {
      name: "Lakshmi Devi",
      rating: 5,
      comment: "15 years of trust and quality. I've been buying from them since they started, and they never disappoint. Highly recommended!",
      location: "Mysore",
      emoji: "🙏"
    },
    {
      name: "Anita Reddy",
      rating: 5,
      comment: "The soft silk saree I purchased was perfect for my daughter's wedding. Beautiful collection and very reasonable prices.",
      location: "Hyderabad",
      emoji: "❤️"
    },
    {
      name: "Meera Patel",
      rating: 5,
      comment: "Authentic sarees with great variety. The family has been so helpful in selecting the perfect saree for every occasion.",
      location: "Chennai",
      emoji: "🌟"
    },
    {
      name: "Sunita Rao",
      rating: 5,
      comment: "Quality and affordability combined! I've bought 5 sarees from them and each one exceeded my expectations.",
      location: "Pune",
      emoji: "😍"
    },
    {
      name: "Kavitha Kumar",
      rating: 5,
      comment: "The Ilkal sarees are genuine and beautifully crafted. Fair pricing and excellent customer service.",
      location: "Coimbatore",
      emoji: "🎉"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-red-800 text-center mb-12">What Our Customers Say</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover-scale transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">{testimonial.emoji}</span>
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-6 italic">"{testimonial.comment}"</p>
              <div className="border-t pt-4">
                <p className="font-semibold text-red-800">{testimonial.name}</p>
                <p className="text-sm text-gray-500">📍 {testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-red-800 mb-4">Join Our Happy Customers</h3>
          <p className="text-gray-600 mb-6">Experience the quality and service that has made us a trusted name for 15+ years</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:+919902963167" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors hover-scale">
              📞 Call Now
            </a>
            <a href="#contact" className="border-2 border-red-600 text-red-600 px-6 py-3 rounded-lg hover:bg-red-600 hover:text-white transition-colors hover-scale">
              💬 Get in Touch
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
