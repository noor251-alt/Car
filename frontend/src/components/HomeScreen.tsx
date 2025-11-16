import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Droplets, Star, Clock, User, Settings, Menu, Bell, MapPin, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import InteractiveBubbles from './InteractiveBubbles';
import ThemeToggle from './ThemeToggle';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme, currentTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const services = [
    {
      id: 'exterior',
      name: 'Extérieur',
      description: 'Lavage extérieur complet avec cire protectrice',
      price: 15,
      duration: 30,
      icon: Droplets,
      gradient: 'from-carcare-cyan-400 to-carcare-cyan-600',
      shadowColor: 'carcare-cyan-500/30',
      features: ['Lavage haute pression', 'Rinçage déminéralisé', 'Séchage microfibre']
    },
    {
      id: 'classic',
      name: 'Classique',
      description: 'Extérieur + intérieur pour un nettoyage complet',
      price: 25,
      duration: 45,
      icon: Car,
      gradient: 'from-emerald-400 to-emerald-600',
      shadowColor: 'emerald-500/30',
      features: ['Lavage extérieur', 'Aspiration intérieur', 'Nettoyage vitres']
    },
    {
      id: 'deep',
      name: 'Profondeur',
      description: 'Nettoyage complet détaillé premium',
      price: 40,
      duration: 60,
      icon: Star,
      gradient: 'from-amber-400 to-orange-500',
      shadowColor: 'orange-500/30',
      badge: 'Premium',
      features: ['Service complet', 'Traitement cuir', 'Polissage carrosserie']
    }
  ];

  const handleServiceSelect = (serviceId: string) => {
    navigate(`/booking/${serviceId}`);
  };

  // Animation des particules de savon
  const soapParticles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    size: Math.random() * 8 + 4,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 3,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className={`screen-container relative overflow-hidden transition-all duration-700 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50'
    }`}>
      {/* Icône de luminosité en position fixe avec safe areas */}
      <ThemeToggle fixed position="top-right" />
      
      {/* Bulles interactives révolutionnaires */}
      <InteractiveBubbles />
      {/* Particules de savon flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {soapParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-br from-white via-carcare-cyan-100 to-carcare-cyan-200 opacity-60"
            style={{
              width: particle.size,
              height: particle.size,
              x: particle.x,
              y: particle.y,
            }}
            animate={{
              y: [particle.y, particle.y - 100, particle.y],
              x: [particle.x, particle.x + 50, particle.x - 30, particle.x],
              scale: [1, 1.2, 0.8, 1],
              opacity: [0.6, 0.8, 0.3, 0.6],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Header avec glassmorphisme révolutionnaire */}
      <motion.div 
        className={`backdrop-blur-xl border-b transition-all duration-700 ${
          theme === 'dark'
            ? 'bg-slate-900/30 border-slate-700/50 shadow-xl shadow-cyan-500/10'
            : 'bg-white/30 border-white/50 shadow-xl shadow-cyan-500/20'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-md mx-auto px-6 py-6 flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.05 }}
          >
            {/* LOGO CARCARE REEL - Centré sans cage */}
            <motion.div 
              className="relative flex items-center justify-center"
              animate={{ 
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Logo CarCare réel - taille agrandie */}
              <motion.img 
                src="/images/carcare-logo-new.png" 
                alt="CarCare" 
                className="w-20 h-20 object-contain"
                animate={{
                  scale: [1, 1.05, 1],
                  filter: [
                    'drop-shadow(0 0 0px rgba(0, 191, 255, 0))',
                    'drop-shadow(0 0 10px rgba(0, 191, 255, 0.4))',
                    'drop-shadow(0 0 0px rgba(0, 191, 255, 0))'
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            
            <div>
              <h1 className={`text-2xl font-bold bg-gradient-to-r from-carcare-cyan-400 to-carcare-cyan-600 bg-clip-text text-transparent`}>
                CarCare
              </h1>
            </div>
          </motion.div>
          
          {/* Informations utilisateur et actions */}
          <div className="flex items-center space-x-3">
            {/* Informations utilisateur */}
            <div className="text-right">
              <p className={`text-sm font-medium ${
                currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className={`text-xs ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {user?.role === 'agent' ? 'Agent CarCare' : 'Client Premium'}
              </p>
            </div>
            
            {/* Avatar utilisateur */}
            <div className={`p-2 rounded-xl backdrop-blur-md border ${
              currentTheme === 'dark'
                ? 'bg-slate-800/50 border-slate-600/50'
                : 'bg-white/50 border-white/50'
            }`}>
              <User className={`w-5 h-5 ${
                currentTheme === 'dark' ? 'text-slate-300' : 'text-gray-600'
              }`} />
            </div>
            
            {/* Bouton déconnexion */}
            <motion.button 
              onClick={handleLogout}
              className={`p-2 rounded-xl backdrop-blur-md border transition-all duration-300 ${
                currentTheme === 'dark'
                  ? 'bg-red-800/30 border-red-600/50 hover:bg-red-700/50 text-red-300'
                  : 'bg-red-100/50 border-red-300/50 hover:bg-red-200/70 text-red-600'
              }`}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Contenu principal */}
      <motion.div 
        className="max-w-md mx-auto px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Message de bienvenue avec glassmorphisme avancé */}
        <motion.div 
          className={`mb-8 p-4 backdrop-blur-xl rounded-3xl border transition-all duration-700 ${
            theme === 'dark'
              ? 'bg-slate-800/30 border-slate-700/50 shadow-xl shadow-cyan-500/10'
              : 'bg-white/30 border-white/50 shadow-xl shadow-cyan-500/20'
          }`}
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold mb-1 ${
                currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>Bonjour, {user?.firstName || 'Utilisateur'} ! 👋</h2>
              <p className={`${
                currentTheme === 'dark' ? 'text-slate-300' : 'text-gray-600'
              }`}>
                {user?.role === 'agent' 
                  ? 'Prêt pour une nouvelle journée de service' 
                  : 'Votre voiture mérite le meilleur'
                }
              </p>
              <div className={`flex items-center mt-2 text-sm ${
                currentTheme === 'dark' ? 'text-cyan-300' : 'text-carcare-cyan-600'
              }`}>
                <MapPin className="w-4 h-4 mr-1" />
                <span>
                  {user?.role === 'agent' 
                    ? 'Zone de service CarCare' 
                    : '12 Rue de Paris, 75001'
                  }
                </span>
              </div>
            </div>
            <motion.div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-cyan-600/30 to-cyan-700/30 backdrop-blur-sm'
                  : 'bg-gradient-to-br from-carcare-cyan-100 to-carcare-cyan-200'
              }`}
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Car className={`w-8 h-8 ${
                theme === 'dark' ? 'text-cyan-300' : 'text-carcare-cyan-600'
              }`} />
            </motion.div>
          </div>
        </motion.div>

        {/* Services avec design neumorphique moderne */}
        <motion.div 
          className="space-y-6 mb-8"
          variants={itemVariants}
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>Nos Services</h3>
          
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                className="relative group cursor-pointer"
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleServiceSelect(service.id)}
              >
                {/* Badge Premium */}
                {service.badge && (
                  <motion.div 
                    className="absolute -top-2 -right-2 z-20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 + 0.5 }}
                  >
                    <div className="bg-gradient-to-r from-carcare-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      {service.badge}
                    </div>
                  </motion.div>
                )}
                
                {/* Carte service avec glassmorphisme révolutionnaire */}
                <div className={`relative overflow-hidden rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
                  theme === 'dark'
                    ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/40 shadow-xl shadow-cyan-500/10'
                    : 'bg-white/30 border-white/50 hover:bg-white/50 shadow-xl shadow-cyan-500/20'
                } group-hover:shadow-2xl group-hover:border-cyan-500/30`}>
                  {/* Gradient de fond avec effet de mouvement */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-20 transition-all duration-500`} />
                  
                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <div className="relative z-10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <motion.div 
                            className={`p-3 rounded-2xl bg-gradient-to-br ${service.gradient} shadow-xl group-hover:scale-110 transition-transform duration-300`}
                            whileHover={{ rotate: 5 }}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </motion.div>
                          <div>
                            <h4 className={`text-xl font-bold ${
                              theme === 'dark' ? 'text-white' : 'text-gray-800'
                            }`}>{service.name}</h4>
                            <p className={`text-sm ${
                              theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                            }`}>{service.description}</p>
                          </div>
                        </div>
                        
                        {/* Prix et durée avec design amélioré */}
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center">
                            <span className={`text-2xl font-bold ${
                              theme === 'dark' ? 'text-cyan-300' : 'text-carcare-cyan-600'
                            }`}>{service.price} TND</span>
                          </div>
                          <div className={`flex items-center ${
                            theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="text-sm">{service.duration} min</span>
                          </div>
                        </div>
                        
                        {/* Liste des caractéristiques avec animations */}
                        <div className="space-y-1">
                          {service.features.map((feature, i) => (
                            <motion.div 
                              key={i}
                              className={`flex items-center text-xs ${
                                theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                              }`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 + i * 0.05 }}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                theme === 'dark' ? 'bg-cyan-300' : 'bg-carcare-cyan-400'
                              }`} />
                              {feature}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bouton de réservation avec effet 3D */}
                    <motion.div 
                      className="mt-4 pt-4 border-t border-gray-200/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.2 + 0.3 }}
                    >
                      <motion.div 
                        className={`w-full text-center py-3 rounded-2xl bg-gradient-to-r ${service.gradient} text-white font-semibold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer`}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Réserver maintenant
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Réservation en cours avec glassmorphisme avancé */}
        <motion.div 
          className={`backdrop-blur-xl rounded-3xl p-6 border mb-8 transition-all duration-700 ${
            theme === 'dark'
              ? 'bg-slate-800/30 border-slate-700/50 shadow-xl shadow-green-500/10'
              : 'bg-white/30 border-white/50 shadow-xl shadow-green-500/20'
          }`}
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <h3 className={`text-lg font-semibold mb-4 flex items-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse" />
            Réservation en cours
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Car className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>Lavage Classique</p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                }`}>Aujourd'hui 14:30</p>
                <div className="flex items-center mt-1">
                  <div className={`w-20 h-1 rounded-full mr-2 ${
                    theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'
                  }`}>
                    <motion.div 
                      className="h-1 bg-green-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 2, delay: 0.5 }}
                    />
                  </div>
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                  }`}>75% terminé</span>
                </div>
              </div>
            </div>
            <motion.button 
              onClick={() => navigate('/tracking')}
              className="bg-gradient-to-r from-carcare-cyan-500 to-carcare-cyan-600 text-white px-6 py-3 rounded-2xl text-sm font-medium shadow-xl hover:shadow-2xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Suivre
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Navigation bottom avec glassmorphisme révolutionnaire */}
      <motion.div 
        className={`fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t transition-all duration-700 ${
          theme === 'dark'
            ? 'bg-slate-900/40 border-slate-700/50 shadow-2xl shadow-cyan-500/10'
            : 'bg-white/40 border-white/50 shadow-2xl shadow-cyan-500/20'
        }`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-around">
          {[
            { icon: User, label: 'Accueil', active: true },
            { icon: Clock, label: 'Historique', active: false },
            { icon: Settings, label: 'Compte', active: false },
          ].map((item, index) => (
            <motion.button 
              key={item.label}
              className={`flex flex-col items-center space-y-1 p-3 rounded-2xl transition-all duration-300 ${
                item.active 
                  ? 'bg-gradient-to-r from-carcare-cyan-500 to-carcare-cyan-600 text-white shadow-xl shadow-cyan-500/30' 
                  : `${theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`
              }`}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
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

export default HomeScreen;