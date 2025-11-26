// src/components/Home.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './Home.css';

const Home: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Focus the input when the home hero loads
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    navigate('/chat', { state: { initialPrompt: trimmed } });
  };

  return (
    <Layout minimal>
      <div className="home-hero">
        <video
          className="home-hero-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/assets/video/home-hero-bg.mp4" type="video/mp4" />
        </video>

        <div className="home-hero-inner">
          <div className="home-hero-text">
            <h1 className="home-hero-title">What would you like to test today?</h1>
            <p className="home-hero-subtitle">
              Describe the application, API, or endpoint you want Camelot to assess, and Arthur will help you
              plan and run the right security checks.
            </p>
          </div>

          <form className="home-hero-prompt" onSubmit={handleSubmit}>
            <div className="home-hero-input-wrapper">
              <input
                ref={inputRef}
                className="home-hero-input"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Scan my production login page for OWASP Top 10 issues"
                aria-label="Describe what you would like to test today"
              />
              {/* No visible submit button — pressing Enter in the input submits the form */}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
