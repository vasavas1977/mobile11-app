import React from 'react';
import { motion } from 'framer-motion';

export const TravelerPhoneIllustration: React.FC = () => {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Background circle */}
      <motion.circle
        cx="200"
        cy="200"
        r="180"
        fill="#FFF5E6"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Decorative clouds */}
      <motion.g
        animate={{ x: [0, 10, 0], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <ellipse cx="80" cy="100" rx="25" ry="15" fill="#FDE7C5" />
        <ellipse cx="95" cy="95" rx="20" ry="12" fill="#FDE7C5" />
        <ellipse cx="65" cy="105" rx="18" ry="10" fill="#FDE7C5" />
      </motion.g>
      
      <motion.g
        animate={{ x: [0, -8, 0], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <ellipse cx="320" cy="120" rx="22" ry="13" fill="#FDE7C5" />
        <ellipse cx="335" cy="115" rx="18" ry="10" fill="#FDE7C5" />
      </motion.g>

      {/* Ground/grass */}
      <motion.ellipse
        cx="200"
        cy="350"
        rx="140"
        ry="25"
        fill="#7DD3A0"
        animate={{ scaleX: [1, 1.03, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Character body group with bounce */}
      <motion.g
        animate={{ 
          y: [0, -8, 0],
          rotate: [-1, 1, -1]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        style={{ originX: '200px', originY: '320px' }}
      >
        {/* Legs */}
        <motion.g
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: '180px', originY: '280px' }}
        >
          <rect x="165" y="280" width="25" height="55" rx="10" fill="#4A5568" />
          <rect x="165" y="325" width="28" height="18" rx="5" fill="#8B5A2B" />
        </motion.g>
        
        <motion.g
          animate={{ rotate: [3, -3, 3] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: '220px', originY: '280px' }}
        >
          <rect x="210" y="280" width="25" height="55" rx="10" fill="#4A5568" />
          <rect x="207" y="325" width="28" height="18" rx="5" fill="#8B5A2B" />
        </motion.g>
        
        {/* Body / Shirt */}
        <motion.path
          d="M160 200 C160 180, 180 160, 200 160 C220 160, 240 180, 240 200 L245 285 L155 285 Z"
          fill="#F97316"
          animate={{ scaleY: [1, 1.02, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Backpack */}
        <motion.g
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="120" y="180" width="35" height="70" rx="8" fill="#E67E22" />
          <rect x="125" y="190" width="25" height="15" rx="4" fill="#D35400" />
          <rect x="130" y="230" width="20" height="10" rx="3" fill="#D35400" />
        </motion.g>
        
        {/* Left arm (waving) */}
        <motion.g
          animate={{ rotate: [-15, 15, -15] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: '145px', originY: '200px' }}
        >
          <rect x="125" y="195" width="40" height="22" rx="10" fill="#FDBF6F" />
          {/* Hand */}
          <circle cx="120" cy="206" r="14" fill="#FDBF6F" />
        </motion.g>
        
        {/* Right arm holding phone */}
        <motion.g
          animate={{ rotate: [5, -5, 5] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: '255px', originY: '200px' }}
        >
          <rect x="235" y="195" width="45" height="22" rx="10" fill="#FDBF6F" />
          {/* Hand */}
          <circle cx="285" cy="200" r="14" fill="#FDBF6F" />
          
          {/* Phone */}
          <motion.g
            animate={{ rotate: [-8, 8, -8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect x="275" y="160" width="40" height="70" rx="6" fill="#2D3748" />
            <rect x="278" y="165" width="34" height="55" rx="3" fill="#60A5FA" />
            
            {/* Phone screen content - signal waves */}
            <motion.g
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <circle cx="295" cy="192" r="8" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="295" cy="192" r="5" fill="white" />
            </motion.g>
            
            {/* Data speed indicator */}
            <motion.text
              x="295"
              y="210"
              fill="white"
              fontSize="8"
              textAnchor="middle"
              fontWeight="bold"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ∞
            </motion.text>
          </motion.g>
        </motion.g>
        
        {/* Head */}
        <motion.g
          animate={{ rotate: [-3, 3, -3], y: [0, -2, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Face */}
          <circle cx="200" cy="130" r="45" fill="#FDBF6F" />
          
          {/* Hair */}
          <path
            d="M155 115 C155 85, 175 65, 200 65 C225 65, 245 85, 245 115 L245 105 C245 80, 225 60, 200 60 C175 60, 155 80, 155 105 Z"
            fill="#4A2C2A"
          />
          
          {/* Sunglasses */}
          <rect x="170" y="118" width="25" height="18" rx="5" fill="#2D3748" />
          <rect x="205" y="118" width="25" height="18" rx="5" fill="#2D3748" />
          <line x1="195" y1="127" x2="205" y2="127" stroke="#2D3748" strokeWidth="3" />
          
          {/* Smile */}
          <motion.path
            d="M185 148 Q200 162, 215 148"
            stroke="#D97706"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            animate={{ d: ["M185 148 Q200 162, 215 148", "M185 150 Q200 167, 215 150", "M185 148 Q200 162, 215 148"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Hat */}
          <ellipse cx="200" cy="80" rx="50" ry="12" fill="#D97706" />
          <path d="M160 80 L165 50 L235 50 L240 80" fill="#F97316" />
        </motion.g>
      </motion.g>
      
      {/* WiFi/signal burst effects */}
      <motion.g
        animate={{ 
          opacity: [0, 1, 0],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
      >
        <circle cx="320" cy="140" r="15" stroke="#F97316" strokeWidth="2" fill="none" />
      </motion.g>
      
      <motion.g
        animate={{ 
          opacity: [0, 1, 0],
          scale: [0.8, 1.3, 0.8]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
      >
        <circle cx="320" cy="140" r="25" stroke="#F97316" strokeWidth="2" fill="none" />
      </motion.g>
      
      <motion.g
        animate={{ 
          opacity: [0, 0.7, 0],
          scale: [0.8, 1.4, 0.8]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
      >
        <circle cx="320" cy="140" r="35" stroke="#F97316" strokeWidth="2" fill="none" />
      </motion.g>
      
      {/* Floating data icons */}
      <motion.g
        animate={{ 
          y: [-10, 10, -10],
          x: [0, 5, 0],
          rotate: [0, 10, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="100" cy="200" r="18" fill="#60A5FA" />
        <text x="100" y="205" fill="white" fontSize="14" textAnchor="middle" fontWeight="bold">4G</text>
      </motion.g>
      
      <motion.g
        animate={{ 
          y: [5, -15, 5],
          x: [0, -5, 0],
          rotate: [0, -10, 0]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <circle cx="300" cy="250" r="20" fill="#10B981" />
        <text x="300" y="255" fill="white" fontSize="12" textAnchor="middle" fontWeight="bold">5G</text>
      </motion.g>
      
      {/* Speed lines */}
      <motion.g
        animate={{ opacity: [0, 1, 0], x: [-20, 20, -20] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <line x1="340" y1="180" x2="370" y2="180" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
        <line x1="335" y1="195" x2="375" y2="195" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
        <line x1="340" y1="210" x2="365" y2="210" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
};

export default TravelerPhoneIllustration;
