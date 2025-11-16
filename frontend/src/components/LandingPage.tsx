import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Clock, 
  Star, 
  Check, 
  Users, 
  Wrench,
  Droplets,
  Sparkles,
  ArrowRight,
  LogIn,
  Settings
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const advantages = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Service Sécurisé",
      description: "Vos données sont protégées par un système de cryptage avancé"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Disponibilité 24/7",
      description: "Service disponible à tout moment, où que vous soyez"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Qualité Premium",
      description: "Des services de haute qualité avec garantie de satisfaction"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Support Dédié",
      description: "Une équipe d'experts à votre service pour vous accompagner"
    }
  ];

  const packages = [
    {
      name: "Lavage Basic",
      price: "15€",
      period: "par lavage",
      features: [
        "Lavage extérieur",
        "Nettoyage vitres",
        "Aspiration intérieur",
        "Séchage professionnel"
      ],
      popular: false
    },
    {
      name: "Lavage Premium",
      price: "25€",
      period: "par lavage",
      features: [
        "Tout du Basic +",
        "Nettoyage jantes",
        "Cire protectrice",
        "Parfum intérieur",
        "Traitement cuir"
      ],
      popular: true
    },
    {
      name: "Entretien Complet",
      price: "45€",
      period: "par session",
      features: [
        "Tout du Premium +",
        "Nettoyage moteur",
        "Protection anti-UV",
        "Détailing complet",
        "Garantie 6 mois"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background avec gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900" />
      
      {/* Particles d'arrière-plan */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 dark:bg-purple-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header moderne avec logo et bulles */}
      <header className="relative z-10 p-4 md:p-6">
        <div className="flex justify-between items-center">
          {/* Logo principal avec bulles animées */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Bulles animées autour du logo */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                style={{
                  top: `${30 + Math.sin(i * Math.PI / 6) * 40}%`,
                  left: `${30 + Math.cos(i * Math.PI / 6) * 40}%`,
                }}
                animate={{
                  scale: [0.5, 1.2, 0.5],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
            
            {/* Logo seul sans cadre avec étoiles flottantes */}
            <motion.div 
              className="relative"
              whileHover={{ 
                scale: 1.1
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <img 
                src="/images/carcare-logo-new.png" 
                alt="CarCare Logo" 
                className="w-24 h-24 object-contain"
              />
              
              {/* Étoiles flottantes autour du logo */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                  style={{
                    top: `${10 + Math.sin(i * Math.PI / 4) * 50}%`,
                    left: `${10 + Math.cos(i * Math.PI / 4) * 50}%`,
                  }}
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: "easeInOut"
                  }}
                />
              ))}
              
              {/* Cercles concentriques animés */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`ring-${i}`}
                  className="absolute border-2 border-cyan-400/30 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    width: `${80 + i * 40}px`,
                    height: `${80 + i * 40}px`,
                    marginLeft: `-${40 + i * 20}px`,
                    marginTop: `-${40 + i * 20}px`,
                  }}
                  animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Bouton de connexion */}
          <motion.button
            onClick={onLoginClick}
            className="flex items-center space-x-2 px-6 md:px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <LogIn className="w-5 h-5" />
            <span>Se Connecter</span>
          </motion.button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-6">
            L'excellence du
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {" "}lavage automobile
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Découvrez notre service de lavage et d'entretien automobile premium. 
            Des résultats exceptionnels, un service de qualité et une expérience cliente exceptionnelle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={onLoginClick}
              className="flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Commencer Maintenant</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-5 h-5" />
              <span>Voir nos Services</span>
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section id="services-section" className="relative z-10 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Nos Services
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Une gamme complète de services pour prendre soin de votre véhicule
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: <Droplets className="w-12 h-12" />,
                title: "Lavage Complet",
                description: "Lavage intérieur et extérieur avec produits de qualité premium"
              },
              {
                icon: <Sparkles className="w-12 h-12" />,
                title: "Détailing",
                description: "Soin détaillé pour restaurer l'éclat neuf de votre véhicule"
              },
              {
                icon: <Wrench className="w-12 h-12" />,
                title: "Entretien",
                description: "Maintenance préventive et réparation avec des experts certifiés"
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                className="p-8 rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 shadow-glass hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-blue-500 dark:text-purple-400 mb-4">
                  {service.icon}
                </div>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  {service.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages Section */}
      <section className="relative z-10 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Pourquoi Choisir CarCare ?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Les avantages qui font de nous votre meilleur choix
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((advantage, index) => (
              <motion.div
                key={index}
                className="text-center p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 shadow-glass hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-blue-500 dark:text-purple-400 mb-4 flex justify-center">
                  {advantage.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  {advantage.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {advantage.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Forfaits Section */}
      <section className="relative z-10 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Nos Forfaits
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Choisissez le forfait qui correspond à vos besoins
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={index}
                className={`relative p-8 rounded-3xl backdrop-blur-xl border-2 transition-all duration-300 ${
                  pkg.popular
                    ? 'bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-blue-500 dark:border-purple-400 shadow-xl scale-105'
                    : 'bg-white/80 dark:bg-gray-800/80 border-white/20 shadow-glass hover:shadow-xl'
                }`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: pkg.popular ? 1.02 : 1.02 }}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Populaire
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {pkg.name}
                  </h4>
                  <div className="text-4xl font-bold text-gray-800 dark:text-white mb-1">
                    {pkg.price}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {pkg.period}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  className={`w-full py-3 rounded-2xl font-medium transition-all duration-300 ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Choisir ce forfait
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 md:px-6 py-8 md:py-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border-t border-white/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600">
                <img 
                  src="/images/carcare-logo-new.png" 
                  alt="CarCare Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">
                CarCare
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-400 text-center">
                © 2025 CarCare. Tous droits réservés.
              </span>
              <motion.button
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors duration-300 min-h-[44px]"
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/admin')}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm md:text-base">Accès Admin</span>
              </motion.button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;