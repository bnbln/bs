import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './GridMotion.css';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface BrandItem {
  name: string;
  image?: string;
  text?: string;
  width: string;
  height: string;
  backgroundColor: string;
}

const GridMotion = ({ items = [] as (string | React.ReactNode | BrandItem)[], gradientColor = 'black' }) => {
  const gridRef = useRef(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalItems = 28;
  const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
  const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  useEffect(() => {
    const maxMoveAmount = 300;

    rowRefs.current.forEach((row, index) => {
      if (row) {
        const direction = index % 2 === 0 ? 1 : -1;
        
        gsap.fromTo(row, 
          { x: -maxMoveAmount * direction },
          {
            x: maxMoveAmount * direction,
            duration: 2,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
              onUpdate: (self) => {
                const progress = self.progress;
                const moveAmount = (progress * 2 - 1) * maxMoveAmount * direction;
                gsap.set(row, { x: moveAmount });
              }
            }
          }
        );
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const renderContent = (content: string | React.ReactNode | BrandItem) => {
    // Handle brand objects
    if (typeof content === 'object' && content !== null && 'name' in content) {
      const brand = content as BrandItem;
      
      if (brand.image) {
        return (
          <div
            className="row__item-img"
            style={{
              backgroundImage: `url(${brand.image})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          ></div>
        );
      } else if (brand.text) {
        return (
          <div className="row__item-content" style={{ color: brand.backgroundColor === 'white' ? 'black' : 'white' }}>
            {brand.text}
          </div>
        );
      } else {
        return (
          <div className="row__item-content" style={{ color: brand.backgroundColor === 'white' ? 'black' : 'white' }}>
            {brand.name}
          </div>
        );
      }
    }
    
    // Handle legacy string content
    if (typeof content === 'string') {
      if (content.startsWith('http')) {
        return (
          <div
            className="row__item-img"
            style={{
              backgroundImage: `url(${content})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          ></div>
        );
      } else if (content.includes('localhost')) {
        return (
          <div
            className="row__item-img"
            style={{
              backgroundImage: `url(${content})`,
            }}
          ></div>
        );
      } else if (content === '') {
        return <div className="row__item-content" style={{ opacity: 0 }}></div>;
      } else {
        return <div className="row__item-content">{content}</div>;
      }
    }
    
    // Handle React nodes
    return <div className="row__item-content">{content}</div>;
  };

  return (
    <div className="noscroll loading" ref={gridRef}>
      <section
        className="intro"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        <div className="gridMotion-container">
          {[...Array(4)].map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="row"
              ref={(el) => {
                rowRefs.current[rowIndex] = el;
              }}
            >
              {[...Array(7)].map((_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];
                const backgroundColor = typeof content === 'object' && content !== null && 'backgroundColor' in content 
                  ? (content as BrandItem).backgroundColor 
                  : 'white';
                
                return (
                  <div key={itemIndex} className="row__item">
                    <div className="row__item-inner" style={{ backgroundColor }}>
                      {renderContent(content)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="fullview"></div>
      </section>
    </div>
  );
};

export default GridMotion; 