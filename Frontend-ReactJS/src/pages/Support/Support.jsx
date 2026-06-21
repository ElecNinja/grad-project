import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  User, FileText, Gavel, Video, MessageCircle, CreditCard, Star, Users, Wrench, HelpCircle, Search, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import Loader from '../../components/Loader/Loader';
import SuccessMessage from '../../components/SuccessMessage/SuccessMessage';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import api from '../../apis/axios';
import './Support.css';

const FAQ_DATA = [
  // 1. Account & Signup
  {
    category: 'account',
    question: "Why do I see an 'email rate limit exceeded' error when signing up?",
    answer: "This is a temporary rate limit enforced by our authentication provider (Supabase) to prevent spam. Please wait a few minutes before requesting another verification email or trying to sign up again."
  },
  {
    category: 'account',
    question: "I forgot my password or cannot log in. What should I do?",
    answer: "Click the 'Forgot Password' link on the login page, enter your email address, and we will send you a password reset link. Ensure you check your spam/junk folder if you don't receive it within a few minutes."
  },
  {
    category: 'account',
    question: "Why won't my profile photo upload?",
    answer: "Make sure the file format is PNG, JPG, or GIF, and the size does not exceed 5 MB. If it still fails, try refreshing the page or using a different browser."
  },
  {
    category: 'account',
    question: "How do I choose or switch between Student and Teacher roles?",
    answer: "You choose your role during the sign-up process. Role switching is currently disabled after registration to protect the integrity of match records and teaching history. If you chose the wrong role, please contact support to update it."
  },
  {
    category: 'account',
    question: "I didn't receive the email verification link. What should I do?",
    answer: "Wait 2-3 minutes, check your spam or promotions folder, and verify that you entered the email address correctly. If you still don't receive it, contact us using the form below and we can manually verify your account."
  },
  // 2. Uploading Materials & AI Matching
  {
    category: 'materials_ai',
    question: "My PDF upload fails or the AI analysis seems stuck. Why?",
    answer: "PDF uploads can fail if the file is password-protected, encrypted, or larger than 10 MB. If the AI analysis is stuck in 'pending_analysis', our LLM server might be experiencing high traffic. Try refreshing or re-uploading a simpler, smaller PDF."
  },
  {
    category: 'materials_ai',
    question: "Why is my request stuck in 'pending_analysis' or 'open' status?",
    answer: "'pending_analysis' means the system is currently processing the PDF to extract subjects and keywords. Once analysis finishes, it transitions to 'open', making it visible to teachers who can now bid. It will remain 'open' until a teacher's bid is accepted."
  },
  {
    category: 'materials_ai',
    question: "How does the AI matching work? Why haven't any teachers matched yet?",
    answer: "Our system automatically extracts keywords from your uploaded material and matches them with teacher specialties. If you haven't received matches or bids, it may be because your PDF subject is highly specialized or there are currently no active teachers in that category. Try adding a detailed text description manually to increase visibility."
  },
  {
    category: 'materials_ai',
    question: "What are the supported file types and size limits for materials?",
    answer: "We support PDF format (.pdf) for educational materials. The maximum file size limit is 10 MB to ensure smooth processing by our AI model."
  },
  // 3. Bidding & Offers
  {
    category: 'bidding',
    question: "How does bidding work? Can I receive multiple offers?",
    answer: "Yes, once your request is 'open', multiple qualified teachers can submit bids specifying their price, teaching mode (live 1-on-1, recorded, or bootcamp), and a brief comment. You can view, compare, and accept the offer that suits you best."
  },
  {
    category: 'bidding',
    question: "How do I accept or reject a bid?",
    answer: "Navigate to your request details page or your Dashboard. Under the 'Bids' section, click 'Accept' on your chosen offer to proceed to session setup and lock the deal. Other bids will be automatically declined or kept on hold."
  },
  {
    category: 'bidding',
    question: "What happens when a bid expires?",
    answer: "Bids have an expiration timer set by the teacher or defaults to 48 hours. Once expired, you can no longer accept the bid. You can message the teacher to ask them to submit a new offer if you're still interested."
  },
  {
    category: 'bidding',
    question: "Can I dispute the price or session terms before accepting?",
    answer: "Yes! Use the chat system to message the teacher directly, discuss the scope of study, and negotiate price or terms. Once you agree, the teacher can update their bid or submit a new one before you click Accept."
  },
  // 4. Sessions & Bootcamps
  {
    category: 'sessions',
    question: "My live 1-on-1 session link is not working. What should I do?",
    answer: "Verify your internet connection and make sure the session time has started. Try refreshing the session page. If the link is still broken, message your teacher immediately in the chat room to request an updated URL."
  },
  {
    category: 'sessions',
    question: "Why won't the recorded course video play?",
    answer: "Ensure you are using a modern browser (Chrome, Firefox, Safari) and that your browser extensions aren't blocking video elements. If the video fails to load, the server hosting the media might be experiencing downtime; try again in a few minutes."
  },
  {
    category: 'sessions',
    question: "I'm having bootcamp enrollment issues or a section is locked unexpectedly.",
    answer: "Bootcamp sections are scheduled and open sequentially based on dates or completion of prerequisite tasks/sprints. If a section is locked unexpectedly, check if you completed the previous sprint, or verify with the teacher if the publish date has passed."
  },
  {
    category: 'sessions',
    question: "Why did I hit a 'rewatch limit reached' error on a lesson?",
    answer: "To prevent account sharing and content scraping, teachers may set a maximum number of times a recorded lesson video can be viewed. If you need this limit raised for study purposes, please contact your teacher directly."
  },
  {
    category: 'sessions',
    question: "How do I reschedule or cancel a session?",
    answer: "You can request rescheduling or cancellation through the session detail page at least 12 hours before the start. Cancellations made less than 12 hours in advance are subject to our cancellation fee policy."
  },
  {
    category: 'sessions',
    question: "What is the policy if a student or teacher doesn't show up?",
    answer: "If a party is a no-show (over 15 minutes late), please report it on the session details page. Teachers who no-show are not paid, and students who no-show are not eligible for a refund."
  },
  // 5. Messaging
  {
    category: 'messaging',
    question: "Why can't I message a teacher or student?",
    answer: "To prevent spam, messaging is only allowed once a bid is made, a session is created, or a connection is established through an offer. If you still cannot message, verify if either party has blocked communications."
  },
  {
    category: 'messaging',
    question: "My messages are not sending or not being received.",
    answer: "This is usually due to a network connection drop. Verify your internet connection. If the issue persists, log out and log back in to renew your connection to the real-time presence system."
  },
  {
    category: 'messaging',
    question: "How do I report inappropriate messages or behavior?",
    answer: "Open the conversation window, click the user profile, and select 'Report User'. Alternatively, take a screenshot and submit a support ticket under the 'messaging' category using the form below."
  },
  // 6. Payments
  {
    category: 'payments',
    question: "My payment failed or is stuck in 'pending'. What should I do?",
    answer: "Check that your card has sufficient funds and that international payments are enabled. If the transaction was interrupted, do not try again immediately to avoid duplicate charges. Check your email for a receipt or check the status under your billing history."
  },
  {
    category: 'payments',
    question: "How do refund requests work?",
    answer: "Refund requests can be submitted within 24 hours of a completed session if the session terms were not met. Refunds are subject to review of the session logs and chat communications. To request a refund, submit a ticket below with category 'Payments'."
  },
  {
    category: 'payments',
    question: "As a teacher, why haven't I received my payout?",
    answer: "Payouts are processed via Stripe Connect. Ensure your Stripe dashboard has complete verification info and bank details. Payouts are made 7 days after session completion to allow for refund review periods."
  },
  {
    category: 'payments',
    question: "What are the platform fees?",
    answer: "StudyBuddy charges a 10% platform fee on student transactions to cover hosting, payment processing, and our AI matching infrastructure. This is included in the final price shown during bid confirmation."
  },
  // 7. Reviews & Ratings
  {
    category: 'reviews',
    question: "Why can't I leave a review after a session?",
    answer: "Reviews can only be submitted for completed sessions. The review option is open for 14 days following session completion. Ensure the session status in your dashboard shows 'completed'."
  },
  {
    category: 'reviews',
    question: "How do I dispute a review left about me?",
    answer: "If you believe a review is unfair or contains abusive language, submit a support ticket selecting the 'reviews' category. Provide the session ID and details of why the review violates our community guidelines."
  },
  {
    category: 'reviews',
    question: "How is my average rating calculated?",
    answer: "Your average rating is the simple arithmetic mean of all ratings submitted by students for your completed sessions. New accounts will show 'No ratings' until their first review is received."
  },
  // 8. Community Resources
  {
    category: 'community',
    question: "How do I upload or download public resources?",
    answer: "Go to the Community page. Students and teachers can click 'Upload Resource' to share study materials. Anyone can browse and download resources for free. Shared materials must respect intellectual property rights."
  },
  {
    category: 'community',
    question: "How do I report copyright infringement or inappropriate content?",
    answer: "Click the flag/report icon next to the resource on the Community page, or submit a support ticket below in the 'community' category with a link to the resource."
  },
  // 9. Technical Issues
  {
    category: 'technical',
    question: "The website is slow, not loading, or has layout issues.",
    answer: "We recommend using the latest version of Google Chrome, Mozilla Firefox, or Apple Safari. Clear your browser cache and cookies, or disable extensions that block JavaScript."
  },
  {
    category: 'technical',
    question: "Can I use StudyBuddy on my mobile device?",
    answer: "Yes, StudyBuddy is fully responsive and optimized for mobile devices. If you experience mobile-specific bugs, please submit a ticket under the 'technical' category."
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All FAQs', icon: HelpCircle },
  { id: 'account', name: 'Account & Signup', icon: User },
  { id: 'materials_ai', name: 'Materials & AI', icon: FileText },
  { id: 'bidding', name: 'Bidding & Offers', icon: Gavel },
  { id: 'sessions', name: 'Sessions & Bootcamps', icon: Video },
  { id: 'messaging', name: 'Messaging', icon: MessageCircle },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'reviews', name: 'Reviews & Ratings', icon: Star },
  { id: 'community', name: 'Community', icon: Users },
  { id: 'technical', name: 'Technical Issues', icon: Wrench }
];

function Support() {
  const user = useSelector((state) => state.user);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  // Category filter state
  const [activeCategory, setActiveCategory] = useState('all');
  // Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'account',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Prefill form details from logged in user profile
  useEffect(() => {
    if (user?.loggedIn) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || user.full_name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Handle accordion toggle
  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await api.post('/api/support/ticket', formData);
      if (response.data?.success) {
        setSuccess(`Support ticket created successfully! Confirmation ID: ${response.data.ticketId}`);
        // Reset message and subject
        setFormData((prev) => ({
          ...prev,
          subject: '',
          message: ''
        }));
      } else {
        setError(response.data?.error || 'Failed to submit support ticket.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter FAQs based on active category and search keyword
  const filteredFaqs = FAQ_DATA.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="support-section">
      <title>Support Center | StudyBuddy</title>

      {/* ── HERO BANNER ────────────────────────────────────────── */}
      <div className="support-hero">
        <div className="support-hero-content">
          <h1>How can we help you?</h1>
          <p className="support-subtext">
            Search our knowledge base or submit a support ticket and we will get back to you shortly.
          </p>
          <div className="support-search-wrapper">
            <Search className="support-search-icon" size={20} />
            <input
              type="text"
              placeholder="Search frequently asked questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="support-search-input"
            />
          </div>
        </div>
      </div>

      {/* ── CATEGORY TABS ──────────────────────────────────────── */}
      <div className="support-container">
        <div className="support-categories-grid">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setOpenFaqIndex(null); // Close accordion on tab change
                }}
                className={`support-category-card ${activeCategory === cat.id ? 'active' : ''}`}
              >
                <div className="category-icon-wrapper">
                  <IconComponent size={24} />
                </div>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* ── FAQS SECTION ────────────────────────────────────────── */}
        <div className="support-faqs-section">
          <h2>
            {CATEGORIES.find((c) => c.id === activeCategory)?.name}
            {searchTerm && ` matching "${searchTerm}"`}
          </h2>

          {filteredFaqs.length === 0 ? (
            <div className="support-faqs-empty">
              <HelpCircle size={48} className="empty-faq-icon" />
              <p>No FAQs match your search or filter. Try typing different keywords or check other categories.</p>
            </div>
          ) : (
            <div className="support-accordion">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className={`support-accordion-item ${isOpen ? 'open' : ''}`}>
                    <button
                      className="support-accordion-header"
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                    >
                      <span className="faq-question">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="faq-chevron" size={20} />
                      ) : (
                        <ChevronDown className="faq-chevron" size={20} />
                      )}
                    </button>
                    <div className="support-accordion-body">
                      <p className="faq-answer">{faq.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── TICKET SUBMISSION FORM ──────────────────────────────── */}
        <div className="support-ticket-card">
          <div className="ticket-card-header">
            <h2>Still need help?</h2>
            <p>If you couldn't find your answer in our FAQs, send us a message directly and we'll create a ticket for you.</p>
          </div>

          {success && <SuccessMessage message={success} />}
          {error && <ErrorMessage message={error} />}

          {loading && <Loader />}

          {!loading && (
            <form onSubmit={handleSubmit} className="support-ticket-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="support-name">Your Name</label>
                  <input
                    type="text"
                    id="support-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="support-email">Your Email</label>
                  <input
                    type="email"
                    id="support-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="support-category">Help Category</label>
                  <select
                    id="support-category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="account">Account & Signup</option>
                    <option value="materials_ai">Uploading Materials & AI</option>
                    <option value="bidding">Bidding & Offers</option>
                    <option value="sessions">Sessions & Bootcamps</option>
                    <option value="messaging">Messaging</option>
                    <option value="payments">Payments & Refunds</option>
                    <option value="reviews">Reviews & Ratings</option>
                    <option value="community">Community Resources</option>
                    <option value="technical">Technical Issues</option>
                    <option value="other">Other / General Inquiry</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="support-subject">Subject</label>
                  <input
                    type="text"
                    id="support-subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Brief summary of the issue"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="support-message">Message Details</label>
                <textarea
                  id="support-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Describe your issue in detail. If applicable, mention the specific session ID, request title, or error message you received."
                />
              </div>

              <button type="submit" className="support-submit-btn">
                <Send size={16} />
                <span>Submit Ticket</span>
              </button>
            </form>
          )}
        </div>

        {/* ── QUICK LINKS ROW ────────────────────────────────────── */}
        <div className="support-quick-links">
          <h3>Quick Links</h3>
          <div className="quick-links-row">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Support;
