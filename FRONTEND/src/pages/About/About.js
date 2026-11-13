import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaCode, FaRocket, FaGraduationCap, FaBrain, FaEnvelope } from 'react-icons/fa';
import './About.css';

const About = () => {
  const authorSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "King Ice Quiz",
    "url": "https://king-ice-quiz.vercel.app",
    "author": {
      "@type": "Person",
      "name": "Olubiyi Isaac Anu",
      "url": "https://github.com/Kingice97",
      "sameAs": [
        "https://github.com/Kingice97",
        "https://x.com/IcekidOlubiyi"
      ]
    }
  };

  return (
    <div className="about-page">
      <Helmet>
        <title>About & Creator - King Ice Quiz</title>
        <meta name="description" content="Learn about King Ice Quiz and its creator, Olubiyi Isaac Anu." />
        <meta name="author" content="Olubiyi Isaac Anu" />
        <meta name="creator" content="Olubiyi Isaac Anu" />
        <script type="application/ld+json">
          {JSON.stringify(authorSchema)}
        </script>
      </Helmet>

      <div className="about-container">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-hero-content">
            <h1>About King Ice Quiz</h1>
            <p>Empowering learners and educators through interactive technology.</p>
          </div>
        </section>

        {/* The Story */}
        <section className="about-section">
          <div className="about-card">
            <h2><FaRocket /> The Story</h2>
            <p>
              King Ice Quiz was born out of a desire to make learning and assessment more engaging, 
              interactive, and accessible. I noticed that traditional testing methods often lacked 
              the excitement needed to truly motivate students. I wanted to build a platform that 
              felt less like an exam and more like a challenge—a place where students could compete, 
              track their progress, and actually enjoy the process of testing their knowledge.
            </p>
            <p>
              From the initial concept to the final deployment, every line of code, every UI design choice, 
              and every feature was handcrafted to deliver a seamless, production-grade experience.
            </p>
          </div>
        </section>

        {/* How it Works */}
        <section className="about-section">
          <div className="about-card">
            <h2><FaGraduationCap /> How It Works</h2>
            <div className="about-features">
              <div className="about-feature-item">
                <FaBrain className="feature-icon" />
                <div>
                  <h3>For Students</h3>
                  <p>Join quizzes using unique access codes, answer interactive questions in real-time, compete on leaderboards, and track your learning journey.</p>
                </div>
              </div>
              <div className="about-feature-item">
                <FaCode className="feature-icon" />
                <div>
                  <h3>For Teachers & Admins</h3>
                  <p>Create both public and private quizzes, generate secure access codes for your classroom, and analyze student performance with detailed analytics.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Developer */}
        <section className="about-section">
          <div className="about-card developer-card">
            <div className="developer-avatar">
              I
            </div>
            <h2>Meet the Developer</h2>
            <h3 className="developer-name">Olubiyi Isaac Anu</h3>
            <p className="developer-title">Founder & Full-Stack Developer</p>
            
            <p className="developer-bio">
              I am a passionate Software Engineer dedicated to building impactful digital solutions. 
              As the sole creator of King Ice Quiz, I designed and developed the entire architecture—from 
              the React frontend and real-time WebSocket chat to the Node.js/Express backend and MongoDB 
              database. I believe in continuous learning and pushing the boundaries of what web applications 
              can do.
            </p>

            <div className="developer-links">
              <a href="https://github.com/Kingice97" target="_blank" rel="noopener noreferrer" className="dev-link github">
                <FaGithub /> GitHub
              </a>
              <a href="https://x.com/IcekidOlubiyi" target="_blank" rel="noopener noreferrer" className="dev-link twitter">
                <FaTwitter /> X (Twitter)
              </a>
              <a href="mailto:olubiyiisaacanu@gmail.com" className="dev-link email">
                <FaEnvelope /> Email Me
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <h2>Ready to start your quiz journey?</h2>
          <div className="about-cta-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
            <Link to="/" className="btn btn-outline btn-lg">Back to Home</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;