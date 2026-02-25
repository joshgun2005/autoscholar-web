import { useEffect, useRef } from 'react';

interface SlideStructure {
  title: string;
  subtitle: string;
  author: string;
  company: string;
  date: string;
  slides: Array<{
    type: 'title' | 'content' | 'two-column' | 'stats' | 'conclusion';
    title?: string;
    content?: string[];
    leftColumn?: string[];
    rightColumn?: string[];
    stats?: Array<{ label: string; value: string; trend?: string }>;
    background?: string;
  }>;
}

interface SlidesViewerProps {
  structure: SlideStructure;
}

export function SlidesViewer({ structure }: SlidesViewerProps) {
  const revealRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically load reveal.js
    const loadReveal = async () => {
      // Load CSS
      const revealCSS = document.createElement('link');
      revealCSS.rel = 'stylesheet';
      revealCSS.href = 'https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.css';
      document.head.appendChild(revealCSS);

      const themeCSS = document.createElement('link');
      themeCSS.rel = 'stylesheet';
      themeCSS.href = 'https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/theme/black.css';
      document.head.appendChild(themeCSS);

      // Load JS
      const revealJS = document.createElement('script');
      revealJS.src = 'https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.js';
      revealJS.onload = () => {
        // @ts-ignore
        if (window.Reveal) {
          // @ts-ignore
          revealRef.current = window.Reveal.initialize({
            hash: true,
            slideNumber: 'c/t',
            transition: 'slide',
            width: 1280,
            height: 720,
            margin: 0.04,
            controls: true,
            progress: true,
            center: true,
            touch: true,
            loop: false,
            rtl: false,
            shuffle: false,
            fragments: true,
            embedded: false,
            help: true,
            showNotes: false,
            autoPlayMedia: null,
            preloadIframes: null,
            autoSlide: 0,
            mouseWheel: false,
            rollingLinks: false,
            previewLinks: false,
          });
        }
      };
      document.body.appendChild(revealJS);
    };

    loadReveal();

    return () => {
      // Cleanup
      if (revealRef.current && revealRef.current.destroy) {
        revealRef.current.destroy();
      }
    };
  }, []);

  const renderSlide = (slide: SlideStructure['slides'][0], index: number) => {
    const bgGradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];

    switch (slide.type) {
      case 'title':
        return (
          <section
            key={index}
            style={{
              background: bgGradients[0],
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '80px 60px'
            }}
          >
            <h1 style={{ fontSize: '3.5em', marginBottom: '30px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              {slide.title}
            </h1>
            {slide.content && slide.content[0] && (
              <h3 style={{ fontSize: '1.8em', opacity: 0.9, marginBottom: '60px' }}>
                {slide.content[0]}
              </h3>
            )}
          </section>
        );

      case 'content':
        return (
          <section key={index} style={{ padding: '60px' }}>
            <h2 style={{
              fontSize: '2.5em',
              marginBottom: '50px',
              borderBottom: '4px solid #667eea',
              paddingBottom: '20px'
            }}>
              {slide.title}
            </h2>
            {slide.content && (
              <ul style={{ fontSize: '1.3em', lineHeight: '1.8' }}>
                {slide.content.map((item, i) => (
                  <li key={i} style={{ marginBottom: '20px' }}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        );

      case 'stats':
        return (
          <section key={index} style={{ padding: '60px' }}>
            <h2 style={{ fontSize: '2.5em', marginBottom: '50px', textAlign: 'center' }}>
              {slide.title}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: slide.stats && slide.stats.length > 3 ? 'repeat(2, 1fr)' : 'repeat(1, 1fr)',
              gap: '40px'
            }}>
              {slide.stats?.map((stat, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '40px',
                  textAlign: 'center',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}>
                  <div style={{ fontSize: '1.2em', opacity: 0.8, marginBottom: '15px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#4ade80' }}>
                    {stat.value}
                  </div>
                  {stat.trend && (
                    <div style={{
                      fontSize: '1.5em',
                      marginTop: '10px',
                      color: stat.trend.startsWith('+') || stat.trend.includes('↑') ? '#4ade80' : '#f87171'
                    }}>
                      {stat.trend}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'two-column':
        return (
          <section key={index} style={{ padding: '60px' }}>
            <h2 style={{ fontSize: '2.5em', marginBottom: '50px', textAlign: 'center' }}>
              {slide.title}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
              <div>
                <ul style={{ fontSize: '1.2em', lineHeight: '1.8' }}>
                  {slide.leftColumn?.map((item, i) => (
                    <li key={i} style={{ marginBottom: '15px' }}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <ul style={{ fontSize: '1.2em', lineHeight: '1.8' }}>
                  {slide.rightColumn?.map((item, i) => (
                    <li key={i} style={{ marginBottom: '15px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );

      case 'conclusion':
        return (
          <section
            key={index}
            style={{
              background: bgGradients[index % bgGradients.length],
              padding: '80px 60px',
              textAlign: 'center'
            }}
          >
            <h2 style={{ fontSize: '3em', marginBottom: '50px' }}>{slide.title || 'Conclusion'}</h2>
            {slide.content && (
              <div style={{ fontSize: '1.5em', lineHeight: '2' }}>
                {slide.content.map((item, i) => (
                  <p key={i} style={{ marginBottom: '25px' }}>{item}</p>
                ))}
              </div>
            )}
            <div style={{ marginTop: '80px', fontSize: '1.2em', opacity: 0.8 }}>
              <p>Généré avec VibeQuant AI</p>
              <p style={{ fontSize: '0.8em' }}>www.vquant.ai</p>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="reveal">
      <div className="slides">
        {/* Title Slide */}
        <section
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px 60px'
          }}
        >
          <h1 style={{ fontSize: '4em', marginBottom: '30px', textShadow: '3px 3px 6px rgba(0,0,0,0.4)' }}>
            {structure.title}
          </h1>
          {structure.subtitle && (
            <h3 style={{ fontSize: '2em', opacity: 0.9, marginBottom: '80px' }}>
              {structure.subtitle}
            </h3>
          )}
          <div style={{ fontSize: '1.3em', opacity: 0.9 }}>
            <p style={{ marginBottom: '10px' }}>
              <strong>{structure.author}</strong>
            </p>
            <p style={{ marginBottom: '10px' }}>{structure.company}</p>
            <p style={{ fontSize: '0.9em', opacity: 0.8 }}>{structure.date}</p>
          </div>
          <div style={{ position: 'absolute', bottom: '40px', fontSize: '0.9em', opacity: 0.7 }}>
            Powered by VibeQuant AI
          </div>
        </section>

        {/* Content Slides */}
        {structure.slides.map((slide, index) => renderSlide(slide, index))}
      </div>
    </div>
  );
}
