import { useEffect } from 'react';

const AdsterraNative: React.FC = () => {
  useEffect(() => {
    const scriptId = 'adsterra-native-script';
    const containerId = 'container-0535f655d3de94b921f35eeb8053f820';

    // Only inject if container exists and script is not already there
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl28993474.profitablecpmratenetwork.com/0535f655d3de94b921f35eeb8053f820/invoke.js';
      
      const container = document.getElementById(containerId);
      if (container) {
        container.appendChild(script);
      }
    }
  }, []);

  return (
    <div 
      id="container-0535f655d3de94b921f35eeb8053f820" 
      style={{ 
        width: '100%', 
        minHeight: '100px', 
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'center'
      }}
    ></div>
  );
};

export default AdsterraNative;
