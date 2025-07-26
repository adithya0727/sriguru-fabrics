import React from 'react';

const About = () => {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-red-800 text-center mb-12">Our Story</h2>
          
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 slide-up">
              <h3 className="text-2xl font-semibold text-red-700 mb-6 flex items-center">
                ❤️ Humble Beginnings
              </h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                What started as a small home-based business 15 years ago has grown into a trusted name in the saree industry. 
                We began with a simple dream - to bring authentic, beautiful sarees to women at prices that wouldn't break their budget. 
                From our humble beginnings selling sarees from home, we've built a reputation based on quality, authenticity, and genuine care for our customers.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our journey has been guided by the values of our namesake - Sri Guru Raghavendra - emphasizing service, 
                authenticity, and building meaningful connections with every customer who walks through our doors.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 slide-up">
              <h3 className="text-2xl font-semibold text-red-700 mb-6 flex items-center">
                👥 Understanding Our Customers
              </h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Every customer teaches us something new. From our very first sale, we've made it our mission to listen carefully 
                to what our customers want and need. Whether it's a bride looking for the perfect wedding saree, a working woman 
                needing elegant office wear, or a grandmother wanting something special for a festival, we've learned that every 
                purchase tells a story.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This understanding has shaped how we source our sarees, price them fairly, and serve each customer with the 
                personal attention they deserve. Our 1500+ satisfied customers are not just buyers - they're part of our extended family.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 slide-up">
              <h3 className="text-2xl font-semibold text-red-700 mb-6 flex items-center">
                🎯 Our Vision
              </h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                We envision a future where beautiful, authentic sarees are accessible to every woman, regardless of her budget. 
                By working directly with artisans and weavers from different regions, we're not just selling sarees - we're 
                supporting traditional craftsmanship and helping preserve India's rich textile heritage.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our goal is to continue building a community of saree lovers who appreciate quality, authenticity, and fair pricing. 
                Every saree we sell carries with it the story of its maker and the joy of its wearer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
