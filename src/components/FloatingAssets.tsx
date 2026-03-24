import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './FloatingAssets.css';

interface Asset {
  id: number;
  icon: string;
  x: number;
  duration: number;
  delay: number;
}

const ICONS = ['₹', '$', '💰', '✨', '💎'];

export default function FloatingAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    // Generate an initial batch of random floating assets
    const newAssets = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      icon: ICONS[Math.floor(Math.random() * ICONS.length)],
      x: Math.random() * 100, // random left percentage
      duration: 10 + Math.random() * 15, // float up between 10-25 seconds
      delay: Math.random() * 10 // random start delay
    }));
    setAssets(newAssets);
  }, []);

  return (
    <div className="floating-assets-container">
      {assets.map((asset) => (
        <motion.div
          key={asset.id}
          className="floating-asset"
          initial={{ y: '100vh', opacity: 0, x: `${asset.x}vw` }}
          animate={{
            y: '-10vh',
            opacity: [0, 0.4, 0.4, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: asset.duration,
            delay: asset.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {asset.icon}
        </motion.div>
      ))}
    </div>
  );
}
