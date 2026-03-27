import { useEffect, useRef } from 'react';

const AdsterraBanner = () => {
  const adContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adContainer.current && !adContainer.current.firstChild) {
      // Set global options for the script
      (window as any).atOptions = {
        'key' : '61fc21ae8af5ed8b16b6521405e6d3d3',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };

      const script = document.createElement('script');
      script.src = 'https://www.highperformanceformat.com/61fc21ae8af5ed8b16b6521405e6d3d3/invoke.js';
      script.async = true;
      
      adContainer.current.appendChild(script);
    }
  }, []);

  return (
    <div 
      className="adsterra-banner-wrapper"
      ref={adContainer}
      style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center',
        margin: '15px 0',
        minHeight: '50px',
        overflow: 'hidden'
      }}
    >
      {/* Ad will be injected here */}
    </div>
  );
};

export default AdsterraBanner;
