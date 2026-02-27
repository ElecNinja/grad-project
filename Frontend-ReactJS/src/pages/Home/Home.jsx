import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { 
  Search, 
  Upload, 
  Star, 
  ChevronRight 
} from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Import images
import homeImg from '../../assets/images/homeimg.png';
import vectorSvg from '../../assets/images/Vector.svg';
import heisenPng from '../../assets/images/heisen.png';
import jinxPng from '../../assets/images/jinx.png';

import './home.css';

function Homepage() {
  const stats = [
    { value: '+30,000', label: 'Experienced Teachers' },
    { value: '+300,000', label: '5-star Teacher reviews' },
    { value: '+10,000', label: 'Subjects Taught' },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Upload',
      description: 'Start by uploading your PDF file assignment, project, research, or any document you need help with.'
    },
    {
      step: '2',
      title: 'Find Your Expert',
      description: 'connects you with qualified teachers and experts who specialize in your topic. You’ll see real profiles, experience, and reviews so you can confidently choose the best match.'
    },
    {
      step: '3',
      title: 'Make progress',
      description: 'Select the expert you like and start getting personalized guidance tailored specifically to your file. Clear explanations, focused help, and real results all in one simple experience.'
    },
  ];

  const testimonials = [
    {
      name: 'Yehia',
      rating: 5,
      quote: 'A great learning experience! Fast communication and high-quality lessons. I highly recommend this platform to anyone who wants to improve their skills.',
      image: vectorSvg
    },
    {
      name: 'Moktar',
      rating: 5,
      quote: 'The classes were really useful, and the teacher made me understand things I used to find difficult.',
      image: vectorSvg
    },
    {
      name: 'Sarah',
      rating: 5,
      quote: 'Amazing platform! The experts are truly knowledgeable and patient. I\'ve learned so much in such a short time.',
      image: vectorSvg
    },
    {
      name: 'Ahmed',
      rating: 5,
      quote: 'Highly recommended! The one-on-one sessions helped me grasp complex topics easily. Great experience overall.',
      image: vectorSvg
    }
  ];

  const experts = [
    {
      name: 'Walter White',
      role: 'Chemistry Teacher',
      rating: 4.0,
      image: heisenPng,
      description: "I'm a high school chemistry teacher. I've spent years inside the lab, teaching students the fundamentals of a science I believe to be the most beautiful of all. I've always believed that science is true power — the kind that comes from understanding. People may see me as just a teacher, but I know there's more inside me — something greater, something waiting to be unleashed. Chemistry isn't just what I do. It's who I am. Study with me, and you won't be in danger from exams — you'll be the danger."
    },
    {
      name: 'Mohamed Walid',
      role: 'Cyber Security Teacher',
      rating: 4.0,
      image: heisenPng,
      description: "I'm Abu Harian, your cyber teacher. I've spent years in the shadows building systems, breaking them, and watching how people lose everything with a single wrong click. The digital world isn't safe; it never was. It's a game of ghosts and power, and I play it better than anyone. They call me a teacher, but I'm more like a warning. Wherever I go, silence follows... and then something crashes. Cybersecurity isn't just my life, it's my curse, my control. Study with me, and you won't just learn how to survive the web. You'll become the one everyone fears."
    },
    {
      name: 'Walter White',
      role: 'Chemistry Teacher',
      rating: 4.0,
      image: heisenPng,
      description: "I'm a high school chemistry teacher. I've spent years inside the lab, teaching students the fundamentals of a science I believe to be the most beautiful of all. I've always believed that science is true power — the kind that comes from understanding. People may see me as just a teacher, but I know there's more inside me — something greater, something waiting to be unleashed. Chemistry isn't just what I do. It's who I am. Study with me, and you won't be in danger from exams — you'll be the danger."
    },
    {
      name: 'Jinx',
      role: 'Math Teacher',
      rating: 4.0,
      image: jinxPng,
      description: "I'm Jinx, your math teacher. I've spent years twisting numbers, breaking rules, and finding patterns where others see chaos. To me, math isn't just logic — it's madness beautifully disguised as order. I've always believed that true genius lies on the edge between reason and insanity. People may think I'm unpredictable, but every move I make adds up perfectly. Math isn't just what I teach. It's what keeps my mind alive. Study with me, and you won't just solve equations — you'll explode them."
    }
  ];

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-wrapper">
            <div className="hero-content">
              <h1 className="hero-title">
                <span className="struggling">Struggling?</span>
                <span className="simple">Let's make it simple.</span>
              </h1>
            </div>
            <div className="hero-image">
              <img src={homeImg} alt="Study illustration" />
            </div>
          </div>
        </div>
      </section>

      {/* White Section */}
      <section className="white-section">
        <div className="container">
          {/* Search Bar */}
          <div className="search-container">
            <div className="search-wrapper">
              <input 
                type="text" 
                placeholder="Find someone who makes learning easy..."
                className="search-input"
              />
              <button className="search-button">
                <Search size={20} />
              </button>
            </div>
          </div>

          {/* Upload Button */}
          <div className="upload-area-simple">
            <p className="upload-label">Share your PDF... Your teacher waiting to help</p>
            <button className="upload-button-large">
              <Upload size={20} />
              Upload
            </button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Keep as is but with colorful numbers */}
<section className="how-it-works-section">
  <div className="container">
    <h2 className="section-title centered">How StudyBuddy works:</h2>
    
    <div className="steps-container">
      {howItWorks.map((step, index) => (
        <div key={index} className="step-card">
          <div className="step-number">{step.step}</div>
          <h3 className="step-title">{step.title}</h3>
          <p className="step-description">{step.description}</p>
          {index === 0 && (
            <div className="drop-zone">
              <p>Drop File Here</p>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
</section>

{/* Testimonials Section - Modern centered title */}
<section className="testimonials-section">
  <div className="container">
    <h2 className="section-title">What Students Are Saying</h2>
    
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={30}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 4000 }}
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
      className="testimonials-swiper"
    >
      {testimonials.map((testimonial, index) => (
        <SwiperSlide key={index}>
          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="testimonial-avatar-wrapper">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="testimonial-avatar-modern" 
                />
              </div>
              <div>
                <h4>{testimonial.name}</h4>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
                  ))}
                </div>
              </div>
            </div>
            <p className="testimonial-quote">"{testimonial.quote}"</p>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
</section>

{/* Experts Section - Modern centered title with fixed images */}
<section className="experts-section">
  <div className="container">
    <h2 className="section-title">Meet Some of Our Amazing Teachers</h2>
    
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={30}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000 }}
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
      className="experts-swiper"
    >
      {experts.map((expert, index) => (
        <SwiperSlide key={index}>
          <div className="expert-card">
            <div className="expert-image-wrapper">
              <img 
                src={expert.image} 
                alt={expert.name} 
                className="expert-image" 
              />
            </div>
            <h3 className="expert-name">{expert.name}</h3>
            <p className="expert-role">{expert.role}</p>
            <div className="expert-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    fill={i < Math.floor(expert.rating) ? "#fbbf24" : "#e5e7eb"} 
                    color={i < Math.floor(expert.rating) ? "#fbbf24" : "#e5e7eb"}
                  />
                ))}
              </div>
              <span className="rating-value">{expert.rating}</span>
            </div>
            <p className="expert-description">{expert.description}</p>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
</section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">
            <span className="cta-stuck">Stuck?</span>{' '}
            <span className="cta-blue">Upload your PDF. We'll take it from there.</span>
          </h2>
          <p className="cta-description">
            Choosing who helps you matters.<br />
            Let's make sure you work with the right teachers,<br />
            in a clear, simple, and stress-free way.
          </p>
          <Link to="/signup" className="cta-button">
            Join Us <ChevronRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Homepage;