import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Car, Check, Droplets, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import InteractiveBubbles from './InteractiveBubbles';
import ThemeToggle from './ThemeToggle';

const BookingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { serviceType } = useParams();
  const { theme } = useTheme();
  const [selectedVehicle, setSelectedVehicle] = useState('berline');
  const [selectedDate, setSelectedDate] = useState('2025-01-20');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [selectedAddress, setSelectedAddress] = useState('12 Rue de Paris, 75001');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState(25); // Prix par défaut

  const vehicles = [
    { 
      id: 'berline', 
      name: 'Berline', 
      icon: '🚗',
      description: 'Voiture compacte',
      multiplier: 1.0
    },
    { 
      id: 'suv', 
      name: 'SUV', 
      icon: '🚙',
      description: 'Véhicule spacieux',
      multiplier: 1.3
    },
    { 
      id: 'utilitaire', 
      name: 'Utilitaire', 
      icon: '🚐',
      description: 'Véhicule professionnel',
      multiplier: 1.5
    }
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const extras = [
    {
      id: 'wax',
      name: 'Cirage Premium',
      price: 8,
      icon: Sparkles,
      description: 'Protection et brillance longue durée'
    },
    {
      id: 'interior',
      name: 'Nettoyage Profond',
      price: 12,
      icon: Car,
      description: 'Shampoing sièges et tapis'
    },
    {
      id: 'engine',
      name: 'Nettoyage Moteur',
      price: 15,
      icon: Zap,
      description: 'Dégraissage compartiment moteur'
    },
    {
      id: 'protection',
      name: 'Traitement Céramique',
      price: 25,
      icon: Droplets,
      description: 'Protection hydrophobe 6 mois'
    }
  ];

  const getServiceInfo = () => {
    const services = {
      exterior: { 
        name: 'Extérieur', 
        basePrice: 15,
        gradient: 'from-carcare-cyan-400 to-carcare-cyan-600',
        duration: 30
      },
      classic: { 
        name: 'Classique', 
        basePrice: 25,
        gradient: 'from-emerald-400 to-emerald-600',
        duration: 45
      },
      deep: { 
        name: 'Profondeur', 
        basePrice: 40,
        gradient: 'from-amber-400 to-orange-500',
        duration: 60
      }
    };
    return services[serviceType as keyof typeof services] || services.classic; // Default to classic instead of exterior
  };

  const serviceInfo = getServiceInfo();
  const selectedVehicleInfo = vehicles.find(v => v.id === selectedVehicle);
  
  // Calcul du prix avec useEffect pour garantir la réactivité
  useEffect(() => {
    const basePrice = serviceInfo.basePrice * (selectedVehicleInfo?.multiplier || 1);
    const extrasPrice = selectedExtras.reduce((sum, extraId) => {
      const extra = extras.find(e => e.id === extraId);
      return sum + (extra?.price || 0);
    }, 0);
    
    const totalPrice = Math.floor(basePrice + extrasPrice); // Arrondi vers le bas pour éviter la surfacturation
    
    // Debug: vérifier les valeurs avec plus de détails
    console.log('Debug Prix (useEffect) - Détails complets:');
    console.log('  serviceType:', serviceType);
    console.log('  basePrice service:', serviceInfo.basePrice);
    console.log('  selectedVehicle:', selectedVehicle);
    console.log('  vehicleInfo:', selectedVehicleInfo);
    console.log('  multiplier:', selectedVehicleInfo?.multiplier);
    console.log('  calculatedBase:', basePrice);
    console.log('  extrasPrice:', extrasPrice);
    console.log('  totalPrice:', totalPrice);
    console.log('  selectedExtras:', selectedExtras);
    
    setCalculatedPrice(totalPrice);
  }, [serviceInfo.basePrice, selectedVehicleInfo?.multiplier, selectedExtras, selectedVehicle, serviceType]);

  const handleConfirm = async () => {
    setLoading(true);
    setTimeout(() => {
      navigate('/tracking');
    }, 2000);
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev => 
      prev.includes(extraId) 
        ? prev.filter(id => id !== extraId)
        : [...prev, extraId]
    );
  };

  // Animations des gouttelettes d'eau
  const waterDrops = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 2,
    x: Math.random() * window.innerWidth,
    size: Math.random() * 4 + 2,
  }));

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

  const cardHover = {
    hover: {
      scale: 1.05,
      rotateY: 10,
      z: 50,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className={`screen-container relative overflow-hidden transition-all duration-700 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-carcare-marine-900' 
        : 'bg-gradient-to-br from-blue-50 via-cyan-50 to-white'
    }`}>
      
      {/* Icône de luminosité en position fixe avec safe areas */}
      <ThemeToggle fixed position="top-right" />
      {/* Bulles interactives révolutionnaires */}
      <InteractiveBubbles />
      
      {/* Gouttelettes d'eau animées plus visibles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {waterDrops.map((drop) => (
          <motion.div
            key={drop.id}
            className="absolute bg-gradient-to-b from-carcare-cyan-300 to-carcare-cyan-600 opacity-80 shadow-lg"
            style={{
              width: drop.size,
              height: drop.size * 2,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              x: drop.x,
              top: -30,
            }}
            animate={{
              y: [0, window.innerHeight + 80],
              opacity: [0, 0.8, 0.6, 0],
              scale: [0.3, 1, 1.2, 0.8],
              rotate: [0, 15, -10, 5]
            }}
            transition={{
              duration: drop.duration + 1,
              repeat: Infinity,
              delay: drop.delay,
              ease: "easeIn"
            }}
          />
        ))}
        
        {/* Gouttelettes supplémentaires plus petites */}
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={`extra-${i}`}
            className="absolute rounded-full bg-carcare-cyan-400/60"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              x: Math.random() * window.innerWidth,
              top: -10,
            }}
            animate={{
              y: [0, window.innerHeight + 20],
              opacity: [0, 0.6, 0],
              x: [0, (Math.random() - 0.5) * 50]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Header avec glassmorphisme adaptatif */}
      <motion.div 
        className={`backdrop-blur-xl border-b transition-all duration-700 ${
          theme === 'dark'
            ? 'bg-black/20 border-white/10'
            : 'bg-white/30 border-white/50'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-md mx-auto px-6 py-4 flex items-center space-x-4">
          <motion.button 
            onClick={() => navigate(-1)} 
            className={`p-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                : 'bg-white/50 border-white/50 hover:bg-white/70 text-gray-700'
            }`}
            whileHover={{ scale: 1.1, rotate: -10 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className={`text-lg font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>Créer une Réservation</h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>Étape {step} sur 3</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="max-w-md mx-auto px-6 py-8 pb-32 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Carte de service avec effet 3D */}
        <motion.div
          variants={itemVariants}
          whileHover="hover"
          {...cardHover}
        >
          <div className={`relative perspective-1000 bg-gradient-to-r ${serviceInfo.gradient} rounded-3xl p-6 text-white shadow-2xl overflow-hidden`}>
            {/* Effet de brillance animé */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              animate={{ x: [-200, 400] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="relative z-10 flex items-center space-x-4">
              <motion.div
                className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                animate={{ 
                  rotateY: [0, 180, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Car className="w-8 h-8" />
              </motion.div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">Lavage {serviceInfo.name}</h2>
                <p className="text-white/90 text-sm mb-2">
                  {calculatedPrice} TND • Durée: {serviceInfo.duration + (selectedExtras.length * 15)} min
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <motion.div
                        key={i}
                        className="text-yellow-300"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          rotate: [0, 10, 0]
                        }}
                        transition={{ 
                          duration: 0.5,
                          delay: i * 0.1,
                          rotate: {
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3
                          }
                        }}
                      >
                        ⭐
                      </motion.div>
                    ))}
                  </div>
                  <span className="text-xs text-white/90 font-medium">5★ Service Premium</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sélection du véhicule avec animations 3D */}
        <motion.div variants={itemVariants}>
          <h3 className={`text-xl font-bold mb-8 flex items-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            <div className="w-3 h-3 bg-gradient-to-r from-carcare-cyan-400 to-carcare-cyan-600 rounded-full mr-4 shadow-lg" />
            Sélection du Véhicule
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {vehicles.map((vehicle, index) => (
              <motion.button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className={`relative p-4 rounded-2xl border-2 text-center transition-all duration-500 backdrop-blur-sm ${
                  selectedVehicle === vehicle.id
                    ? 'border-carcare-cyan-400 bg-carcare-cyan-500/20 shadow-bubble'
                    : `border-white/20 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-white/50 hover:bg-white/70'}`
                }`}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05,
                  rotateY: 15,
                  z: 30
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ 
                  opacity: 1, 
                  rotateY: 0,
                  transition: { delay: index * 0.1 + 0.5 }
                }}
              >
                {selectedVehicle === vehicle.id && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-carcare-cyan-400 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
                
                <div className="text-3xl mb-2">{vehicle.icon}</div>
                <p className={`text-sm font-medium ${
                  selectedVehicle === vehicle.id 
                    ? 'text-carcare-cyan-300' 
                    : theme === 'dark' ? 'text-white' : 'text-gray-700'
                }`}>
                  {vehicle.name}
                </p>
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                }`}>{vehicle.description}</p>
                {vehicle.multiplier !== 1.0 && (
                  <p className="text-xs text-carcare-cyan-300 mt-1">
                    +{Math.round((vehicle.multiplier - 1) * 100)}%
                  </p>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Date et heure avec effet liquide */}
        <motion.div variants={itemVariants}>
          <h3 className={`text-xl font-bold mb-6 flex items-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3" />
            Date & Heure
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <motion.div 
              className={`backdrop-blur-sm rounded-2xl p-4 border transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-white/50 border-white/50'
              }`}
              whileHover={{ scale: 1.02, rotateX: 5 }}
            >
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-carcare-cyan-300" />
                <div>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>Date</p>
                  <p className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>Mardi 23 Janv</p>
                </div>
              </div>
            </motion.div>
            <motion.div 
              className={`backdrop-blur-sm rounded-2xl p-4 border transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-white/50 border-white/50'
              }`}
              whileHover={{ scale: 1.02, rotateX: 5 }}
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-carcare-cyan-300" />
                <div>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>Heure</p>
                  <p className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>{selectedTime}</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Créneaux horaires */}
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((time, index) => (
              <motion.button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  selectedTime === time
                    ? 'bg-carcare-cyan-500 text-white shadow-bubble'
                    : `${theme === 'dark' ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-white/50 text-gray-700 hover:bg-white/70'}`
                }`}
                whileHover={{ scale: 1.05, rotateZ: 5 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { delay: index * 0.05 + 0.8 }
                }}
              >
                {time}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Services additionnels avec animations flottantes */}
        <motion.div variants={itemVariants}>
          <h3 className={`text-xl font-bold mb-6 flex items-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            <div className="w-2 h-2 bg-amber-400 rounded-full mr-3" />
            Services Additionnels
          </h3>
          <div className="space-y-3">
            {extras.map((extra, index) => {
              const Icon = extra.icon;
              const isSelected = selectedExtras.includes(extra.id);
              
              return (
                <motion.div
                  key={extra.id}
                  className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-500 backdrop-blur-sm ${
                    isSelected
                      ? 'border-carcare-cyan-400 bg-carcare-cyan-500/20 shadow-bubble'
                      : `border-white/20 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-white/50 hover:bg-white/70'}`
                  }`}
                  onClick={() => toggleExtra(extra.id)}
                  whileHover={{ 
                    scale: 1.02,
                    rotateX: 5,
                    transition: { duration: 0.2 }
                  }}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { delay: index * 0.1 + 1.0 }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className={`p-3 rounded-xl ${
                          isSelected 
                            ? 'bg-carcare-cyan-500 text-white' 
                            : 'bg-white/10 text-carcare-cyan-300'
                        }`}
                        animate={isSelected ? { 
                          rotate: [0, 360],
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={{ duration: 0.6 }}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                      <div>
                        <p className={`font-medium ${
                          isSelected 
                            ? 'text-carcare-cyan-300' 
                            : theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                          {extra.name}
                        </p>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                        }`}>{extra.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        isSelected 
                          ? 'text-carcare-cyan-300' 
                          : theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>
                        +{extra.price} TND
                      </p>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            className="w-6 h-6 bg-carcare-cyan-400 rounded-full flex items-center justify-center mt-1 ml-auto"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Adresse */}
        <motion.div variants={itemVariants}>
          <h3 className={`text-xl font-bold mb-6 flex items-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            <div className="w-2 h-2 bg-red-400 rounded-full mr-3" />
            Adresse de Service
          </h3>
          <motion.div 
            className={`backdrop-blur-sm rounded-2xl p-4 border transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/50 border-white/50'
            }`}
            whileHover={{ scale: 1.02, rotateY: 5 }}
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-carcare-cyan-300" />
              <div className="flex-1">
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>{selectedAddress}</p>
                <button className="text-carcare-cyan-300 text-sm font-medium hover:text-carcare-cyan-200 transition-colors">
                  Modifier l'adresse
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bouton de confirmation flottant avec effet d'onde */}
      <motion.div 
        className={`fixed left-0 right-0 fixed-bottom-safe backdrop-blur-xl border-t p-4 transition-all duration-700 ${
          theme === 'dark'
            ? 'bg-black/20 border-white/10'
            : 'bg-white/30 border-white/50'
        }`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-white/70' : 'text-gray-600'
            }`}>Total</p>
            <p className="text-2xl font-bold text-carcare-cyan-300">{calculatedPrice} TND</p>
          </div>
          <motion.button
            onClick={handleConfirm}
            disabled={loading}
            className="relative overflow-hidden bg-gradient-to-r from-carcare-cyan-500 to-carcare-cyan-600 text-white px-8 py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-bubble"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(0, 191, 255, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence>
              {loading ? (
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Création...</span>
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Droplets className="w-5 h-5" />
                  <span>Confirmer</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingScreen;