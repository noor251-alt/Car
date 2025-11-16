import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Clock, MessageCircle, Phone, Navigation, Star, Droplets, CheckCircle, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import InteractiveBubbles from './InteractiveBubbles';
import ThemeToggle from './ThemeToggle';

const TrackingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [agentLocation, setAgentLocation] = useState({ lat: 48.8566, lng: 2.3522 });
  const [currentStep, setCurrentStep] = useState(2);
  const [showMessage, setShowMessage] = useState(false);
  
  // Fonction de navigation avec debug
  const handleNavigate = (route: string, label: string) => {
    console.log(`Navigation tentée: ${label} vers ${route}`);
    try {
      navigate(route);
      console.log(`Navigation réussie vers ${route}`);
    } catch (error) {
      console.error(`Erreur navigation vers ${route}:`, error);
    }
  };
  
  const agent = {
    name: 'Ahmed Ben Ali',
    photo: '👨‍💼',
    rating: 4.9,
    services: 'Lavage Classique + Cirage',
    eta: 8,
    vehicle: 'Peugeot Partner Bleu',
    phone: '+216 98 123 456'
  };

  const steps = [
    {
      id: 1,
      title: 'Commande confirmée',
      description: 'Votre réservation a été validée',
      time: '13:45',
      completed: true,
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      id: 2,
      title: 'Agent en route',
      description: 'Ahmed se dirige vers votre adresse',
      time: '14:10',
      completed: true,
      icon: Car,
      color: 'text-carcare-cyan-500'
    },
    {
      id: 3,
      title: 'Arrivée imminente',
      description: 'Agent arrivera dans 8 minutes',
      time: '14:30',
      completed: false,
      icon: MapPin,
      color: 'text-orange-500'
    },
    {
      id: 4,
      title: 'Service en cours',
      description: 'Lavage de votre véhicule',
      time: '14:35',
      completed: false,
      icon: Droplets,
      color: 'text-blue-500'
    },
    {
      id: 5,
      title: 'Service terminé',
      description: 'Véhicule prêt et propre',
      time: '15:20',
      completed: false,
      icon: Star,
      color: 'text-amber-500'
    }
  ];

  // Animation des bulles de savon en arrière-plan
  const soapBubbles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 30 + 10,
    delay: Math.random() * 5,
    duration: Math.random() * 6 + 4,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
  }));

  // Simulation de mise à jour de localisation
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className={`screen-container relative overflow-hidden transition-all duration-700 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-carcare-marine-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-carcare-cyan-50'
    }`}>
      
      {/* Icône de luminosité en position fixe avec safe areas */}
      <ThemeToggle fixed position="top-right" />
      
      {/* Bulles interactives révolutionnaires */}
      <InteractiveBubbles />
      
      {/* Bulles de savon en arrière-plan adaptatives */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {soapBubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            className={`absolute rounded-full backdrop-blur-sm ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-cyan-400/20 to-cyan-600/10'
                : 'bg-gradient-to-br from-carcare-cyan-200/30 to-carcare-cyan-400/20'
            }`}
            style={{
              width: bubble.size,
              height: bubble.size,
              x: bubble.x,
              y: bubble.y,
            }}
            animate={{
              y: [bubble.y, bubble.y - 100, bubble.y],
              x: [bubble.x, bubble.x + 30, bubble.x - 20, bubble.x],
              scale: [1, 1.2, 0.8, 1],
              opacity: [0.3, 0.6, 0.2, 0.3],
            }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              delay: bubble.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Header avec gradient adaptatif */}
      <motion.div 
        className={`relative overflow-hidden transition-all duration-700 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white'
            : 'bg-gradient-to-r from-carcare-cyan-500 to-carcare-cyan-600 text-white'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Effet de vague animé */}
        <motion.div
          className={`absolute inset-0 -skew-x-12 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent'
              : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
          }`}
          animate={{ x: [-300, 400] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative z-10 max-w-md mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${
                theme === 'dark' ? 'bg-white/10' : 'bg-white/20'
              }`}
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <img 
                src="/images/carcare-logo-new.png" 
                alt="CarCare Logo" 
                className="w-12 h-12 object-contain"
              />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold">CarCare</h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-cyan-300' : 'text-white/80'
              }`}>Suivi en temps réel</p>
            </div>
          </div>
          <motion.button 
            className={`p-3 rounded-xl backdrop-blur-sm transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-white/10 hover:bg-white/20' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMessage(!showMessage)}
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Carte de suivi interactive */}
      <motion.div 
        className="relative mx-4 -mt-4 mb-6 rounded-3xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Carte de suivi interactive avec adaptation thématique */}
        <div className={`h-80 relative overflow-hidden transition-all duration-700 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-slate-800 to-slate-700'
            : 'bg-gradient-to-br from-blue-100 to-green-100'
        }`}>
          {/* Grille de la carte avec effet neumorphique */}
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 15 }, (_, i) => (
              <div key={`h-${i}`} className={`absolute w-full border-b ${
                theme === 'dark' ? 'border-slate-500' : 'border-gray-400'
              }`} style={{ top: `${i * 20}px` }} />
            ))}
            {Array.from({ length: 15 }, (_, i) => (
              <div key={`v-${i}`} className={`absolute h-full border-r ${
                theme === 'dark' ? 'border-slate-500' : 'border-gray-400'
              }`} style={{ left: `${i * 25}px` }} />
            ))}
          </div>
          
          {/* Route animée */}
          <svg className="absolute inset-0 w-full h-full">
            <motion.path
              d="M 60 200 Q 180 120 320 180"
              stroke="#00bfff"
              strokeWidth="4"
              fill="none"
              strokeDasharray="12,8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            {/* Ligne de progression */}
            <motion.path
              d="M 60 200 Q 120 160 180 170"
              stroke="#22c55e"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 0.6 }}
              transition={{ duration: 3, ease: "easeInOut", delay: 1 }}
            />
          </svg>
          
          {/* Position de l'agent avec animation pulsante */}
          <motion.div 
            className="absolute"
            style={{ left: '120px', top: '160px' }}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="relative">
              <motion.div
                className="w-12 h-12 bg-carcare-cyan-500 rounded-full flex items-center justify-center shadow-bubble"
                animate={{ 
                  boxShadow: [
                    "0 0 0 0 rgba(0, 191, 255, 0.7)",
                    "0 0 0 20px rgba(0, 191, 255, 0)",
                    "0 0 0 0 rgba(0, 191, 255, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Car className="w-6 h-6 text-white" />
              </motion.div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-medium whitespace-nowrap bg-white/80 px-2 py-1 rounded-lg">
                Ahmed (En route)
              </div>
            </div>
          </motion.div>
          
          {/* Destination */}
          <motion.div 
            className="absolute"
            style={{ right: '60px', top: '140px' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 300 }}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-800 font-semibold whitespace-nowrap bg-white/95 px-3 py-2 rounded-xl shadow-lg border border-white/50 backdrop-blur-sm">
                Vous · 12 Rue de Paris
              </div>
            </div>
          </motion.div>
          
          {/* Points d'intérêt animés */}
          <motion.div 
            className="absolute top-16 left-4 text-xs text-gray-700 bg-white/90 px-3 py-2 rounded-xl shadow-md border border-white/50 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
          >
            📍 Rue de la Paix
          </motion.div>
          <motion.div 
            className="absolute top-32 right-8 text-xs text-gray-700 bg-white/90 px-3 py-2 rounded-xl shadow-md border border-white/50 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
          >
            🏪 Avenue des Champs
          </motion.div>
          <motion.div 
            className="absolute bottom-20 left-16 text-xs text-gray-700 bg-white/90 px-3 py-2 rounded-xl shadow-md border border-white/50 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 300 }}
          >
            🚦 Carrefour Central
          </motion.div>
        </div>
      </motion.div>

      {/* Panneau d'informations agent avec glassmorphisme */}
      <motion.div 
        className="max-w-md mx-auto px-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className={`backdrop-blur-xl rounded-3xl p-6 border transition-all duration-700 ${
            theme === 'dark'
              ? 'bg-slate-800/30 border-slate-700/50 shadow-xl shadow-cyan-500/10'
              : 'bg-white/70 border-white/50 shadow-xl shadow-cyan-500/20'
          }`}
          variants={itemVariants}
        >
          <div className="text-center mb-6">
            <motion.h2 
              className={`text-2xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}
              animate={{ 
                backgroundPosition: ['0%', '100%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{
                background: theme === 'dark' 
                  ? 'linear-gradient(45deg, #ffffff, #00bfff, #ffffff)'
                  : 'linear-gradient(45deg, #374151, #00bfff, #374151)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Agent en route
            </motion.h2>
            <div className="flex items-center justify-center space-x-2">
              <motion.div
                className="w-3 h-3 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-carcare-cyan-600 font-semibold">
                Arrivée dans {agent.eta} minutes
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <p className={`text-sm mb-1 ${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
              }`}>Service: {agent.services}</p>
              <p className={`text-lg font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>{agent.name}</p>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                  }`}>{agent.rating}</span>
                </div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                }`}>{agent.vehicle}</div>
              </div>
            </div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <div className="text-5xl mb-3">{agent.photo}</div>
              <motion.button 
                className="bg-carcare-cyan-100 text-carcare-cyan-600 p-3 rounded-full hover:bg-carcare-cyan-200 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMessage(!showMessage)}
              >
                <MessageCircle className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.button 
              className="bg-gradient-to-r from-carcare-cyan-500 to-carcare-cyan-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:shadow-bubble transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Phone className="w-5 h-5" />
              <span>Appeler</span>
            </motion.button>
            
            <motion.button 
              className={`py-4 rounded-2xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Navigation className="w-5 h-5" />
              <span>Itinéraire</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Timeline de service avec animations séquentielles */}
      <motion.div 
        className="max-w-md mx-auto px-6 mb-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className={`backdrop-blur-xl rounded-3xl p-6 border transition-all duration-700 ${
            theme === 'dark'
              ? 'bg-slate-800/30 border-slate-700/50 shadow-xl shadow-cyan-500/10'
              : 'bg-white/70 border-white/50 shadow-xl shadow-cyan-500/20'
          }`}
          variants={itemVariants}
        >
          <h3 className={`text-xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>Suivi du Service</h3>
          
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.completed;
              
              return (
                <motion.div
                  key={step.id}
                  className="flex items-center space-x-4"
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Ligne de connexion avec animation de progression */}
                  {index < steps.length - 1 && (
                    <div className={`absolute left-[58px] mt-8 w-0.5 h-8 ${
                      theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'
                    }`}>
                      <motion.div
                        className="w-full bg-gradient-to-b from-carcare-cyan-500 to-green-500"
                        initial={{ height: 0 }}
                        animate={{ 
                          height: step.completed ? '100%' : isActive ? '50%' : '0%'
                        }}
                        transition={{ 
                          duration: 0.8, 
                          delay: index * 0.3,
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Icône étape avec animations séquentielles */}
                  <motion.div
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.completed 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : isActive
                        ? 'bg-carcare-cyan-500 text-white shadow-bubble'
                        : `${theme === 'dark' ? 'bg-slate-600 text-slate-400' : 'bg-gray-200 text-gray-400'}`
                    }`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: 1, 
                      rotate: 0,
                      ...(isActive ? {
                        scale: [1, 1.15, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(0, 191, 255, 0.7)",
                          "0 0 0 15px rgba(0, 191, 255, 0)",
                          "0 0 0 0 rgba(0, 191, 255, 0)"
                        ]
                      } : {})
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      delay: index * 0.2,
                      ...(isActive ? { duration: 2, repeat: Infinity } : {})
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    
                    {/* Animation de completion */}
                    {step.completed && (
                      <motion.div
                        className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 500, 
                          delay: index * 0.15 + 0.5 
                        }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.15 + 0.8 }}
                        >
                          <CheckCircle className="w-5 h-5 text-white" />
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {/* Particules de succès pour les étapes complétées */}
                    {step.completed && (
                      <>
                        {Array.from({ length: 6 }, (_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1.5 h-1.5 bg-green-300 rounded-full"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              scale: [0, 1, 0],
                              opacity: [0, 1, 0],
                              x: [0, Math.cos(i * 60 * Math.PI / 180) * 25],
                              y: [0, Math.sin(i * 60 * Math.PI / 180) * 25],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: index * 0.2 + i * 0.1 + 1,
                              ease: "easeOut"
                            }}
                          />
                        ))}
                      </>
                    )}
                  </motion.div>
                  
                  {/* Contenu étape avec animations de texte */}
                  <motion.div 
                    className="flex-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 + 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <motion.h4 
                        className={`font-semibold ${
                          step.completed 
                            ? 'text-green-600' 
                            : isActive 
                            ? 'text-carcare-cyan-600' 
                            : theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                        }`}
                        animate={isActive ? {
                          color: ['#0891b2', '#06b6d4', '#0891b2']
                        } : {}}
                        transition={isActive ? { duration: 2, repeat: Infinity } : {}}
                      >
                        {step.title}
                      </motion.h4>
                      <motion.span 
                        className={`text-sm ${
                          theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.2 + 0.5 }}
                      >
                        {step.time}
                      </motion.span>
                    </div>
                    <motion.p 
                      className={`text-sm mt-1 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.2 + 0.7 }}
                    >
                      {step.description}
                    </motion.p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Chat flottant */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            className={`fixed bottom-24 right-4 rounded-2xl shadow-2xl p-4 max-w-xs border transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-gray-200'
            }`}
            initial={{ opacity: 0, scale: 0, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-carcare-cyan-500 rounded-full flex items-center justify-center text-white text-sm">
                A
              </div>
              <div>
                <p className={`font-semibold text-sm ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>Ahmed</p>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                }`}>En ligne</p>
              </div>
            </div>
            <p className={`text-sm mb-3 ${
              theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Bonjour ! Je suis en route vers votre adresse. J'arrive dans environ 8 minutes. 🚗
            </p>
            <div className="flex space-x-2">
              <button className="flex-1 bg-carcare-cyan-500 text-white text-xs py-2 rounded-lg">
                Répondre
              </button>
              <button 
                className={`px-3 py-2 rounded-lg ${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'
                }`}
                onClick={() => setShowMessage(false)}
              >
                <span className="text-xs">✕</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation bottom glassmorphique */}
      <motion.div 
        className={`fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t transition-all duration-700 ${
          theme === 'dark'
            ? 'bg-slate-900/40 border-slate-700/50 shadow-2xl shadow-cyan-500/10'
            : 'bg-white/40 border-white/50 shadow-2xl shadow-cyan-500/20'
        }`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-around">
          {[
            { icon: Car, label: 'Suivi', active: true, route: '/tracking' },
            { icon: Clock, label: 'Historique', active: false, route: '/home' },
            { icon: MessageCircle, label: 'Support', active: false, route: '/home' },
          ].map((item, index) => (
            <motion.button 
              key={item.label}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigate(item.route, item.label);
              }}
              className={`flex flex-col items-center space-y-2 p-3 rounded-2xl transition-all duration-300 cursor-pointer ${
                item.active 
                  ? 'bg-gradient-to-r from-carcare-cyan-500 to-carcare-cyan-600 text-white shadow-xl shadow-cyan-500/30' 
                  : `${theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`
              }`}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TrackingScreen;