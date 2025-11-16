import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Briefcase, Zap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

interface LoginScreenProps {
  onBack?: () => void;
}

type UserType = 'client' | 'agent';

const LoginScreen: React.FC<LoginScreenProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { login, isLoading: authLoading } = useAuth();
  const [userType, setUserType] = useState<UserType>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    // Validation basique - Tous les utilisateurs utilisent email et mot de passe
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      const success = await login(email, password);
      
      if (success) {
        // Redirection réussie sera gérée par le ProtectedRoute
        navigate('/home');
      } else {
        setError('Identifiants invalides. Veuillez vérifier votre email et mot de passe.');
      }
    } catch (error) {
      setError('Erreur de connexion. Veuillez réessayer.');
      console.error('Erreur de connexion:', error);
    } finally {
      setLoading(false);
    }
  };

  // Particules magiques pour les champs actifs
  const fieldParticles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 0.1,
    angle: (i * 45) * Math.PI / 180
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
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className={`screen-container relative overflow-hidden transition-all duration-1000 ${
      currentTheme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-carcare-marine-900' 
        : 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100'
    }`}>
      
      {/* Icône de luminosité en position fixe avec safe areas */}
      <ThemeToggle fixed position="top-right" />
      
      {/* Header avec bouton retour fixe */}
      {onBack && (
        <motion.button
          onClick={onBack}
          className="fixed top-6 left-6 z-50 p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 shadow-glass hover:shadow-xl transition-all duration-300 safe-area-inset-top safe-area-inset-left"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </motion.button>
      )}

      {/* Header structuré avec bouton thème intégré */}
      <motion.div 
        className={`backdrop-blur-xl border-b transition-all duration-700 ${
          currentTheme === 'dark'
            ? 'bg-slate-900/30 border-slate-700/50 shadow-xl shadow-cyan-500/10'
            : 'bg-white/30 border-white/50 shadow-xl shadow-cyan-500/20'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
          <motion.div 
            className={`max-w-md mx-auto px-6 py-3 flex items-center justify-center ${
              onBack ? 'pt-12' : 'pt-4'
            }`}
          >
            {/* Logo CarCare dans header - Centré et agrandi */}
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
            <img 
              src="/images/carcare-logo-new.png" 
              alt="CarCare Logo" 
              className="w-20 h-20 object-contain"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Arrière-plan animé avec dégradés multiples */}
      <div className="absolute inset-0">
        <motion.div
          className={`absolute inset-0 ${
            currentTheme === 'dark'
              ? 'bg-gradient-to-r from-carcare-cyan-500/20 via-transparent to-carcare-cyan-600/20'
              : 'bg-gradient-to-r from-carcare-cyan-300/30 via-transparent to-carcare-cyan-400/30'
          }`}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className={`absolute inset-0 ${
            currentTheme === 'dark'
              ? 'bg-gradient-to-t from-carcare-marine-900/40 to-transparent'
              : 'bg-gradient-to-t from-blue-200/40 to-transparent'
          }`}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Conteneur principal */}
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <motion.div 
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header avec logo principal intégré */}
          <motion.div 
            className="text-center mb-8"
            variants={itemVariants}
          >
            <motion.h1 
              className={`text-5xl font-bold mb-3 ${
                currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
            >
              <motion.span 
                className="bg-gradient-to-r from-carcare-cyan-400 via-carcare-cyan-500 to-carcare-cyan-600 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: '200% 100%',
                }}
              >
                {/* Texte "CarCare" supprimé selon demande utilisateur */}
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className={`text-xl font-medium ${
                currentTheme === 'dark' ? 'text-white/80' : 'text-gray-600'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              L'Avenir du Lavage Auto
            </motion.p>
          </motion.div>

          {/* Onglets Agent/Client */}
          <motion.div 
            className="flex bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-2 mb-8 border border-white/20 shadow-glass max-w-sm mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.button
              onClick={() => setUserType('client')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                userType === 'client'
                  ? 'bg-white/80 dark:bg-gray-700/80 text-gray-800 dark:text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <User className="w-4 h-4" />
                <span>Client</span>
              </div>
            </motion.button>
            
            <motion.button
              onClick={() => setUserType('agent')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                userType === 'agent'
                  ? 'bg-white/80 dark:bg-gray-700/80 text-gray-800 dark:text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Agent</span>
              </div>
            </motion.button>
          </motion.div>

          {/* Panneau de connexion avec glassmorphisme niveau 2 */}
          <motion.div 
            className={`relative rounded-3xl p-8 shadow-2xl border ${
              currentTheme === 'dark'
                ? 'bg-black/20 border-white/10 shadow-black/50'
                : 'bg-white/30 border-white/30 shadow-gray-200/50'
            } backdrop-blur-2xl`}
            variants={itemVariants}
          >
            {/* Couches de profondeur glassmorphique */}
            <div className={`absolute inset-0 rounded-3xl ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-br from-white/5 to-transparent'
                : 'bg-gradient-to-br from-white/40 to-white/10'
            }`} />
            
            <div className="relative z-10">
              <motion.div 
                className="mb-8"
                variants={itemVariants}
              >
                <h2 className={`text-3xl font-bold mb-3 ${
                  currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Connexion {userType === 'client' ? 'Client' : 'Agent'}
                </h2>
                <p className={`${
                  currentTheme === 'dark' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  {userType === 'client' 
                    ? 'Accédez à vos services CarCare premium' 
                    : 'Accédez à votre espace de travail agent'
                  }
                </p>
                
                {/* Message d'erreur */}
                {error && (
                  <motion.div 
                    className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                      {error}
                    </p>
                  </motion.div>
                )}
              </motion.div>

              {/* Champs de saisie révolutionnaires */}
              <div className="space-y-6">
                {/* Champ Email (Client) ou ID Employé (Agent) */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={userType === 'client' ? 'email' : 'employeeId'}
                    variants={itemVariants}
                    className="relative"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className={`block text-sm font-medium mb-3 ${
                      currentTheme === 'dark' ? 'text-white/90' : 'text-gray-700'
                    }`}>
                      {userType === 'client' ? 'Adresse email' : 'Email professionnel'}
                    </label>
                    
                    <div className="relative">
                      {/* Particules magiques quand le champ est focus */}
                      <AnimatePresence>
                        {focusedField === (userType === 'client' ? 'email' : 'employeeId') && fieldParticles.map(particle => (
                          <motion.div
                            key={particle.id}
                            className="absolute w-1 h-1 bg-carcare-cyan-400 rounded-full"
                            style={{
                              top: '50%',
                              left: '15%',
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              x: Math.cos(particle.angle) * 30,
                              y: Math.sin(particle.angle) * 30,
                              scale: [0, 1, 0],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: particle.delay,
                              ease: "easeOut"
                            }}
                          />
                        ))}
                      </AnimatePresence>

                      {userType === 'client' ? (
                        <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                          focusedField === 'email' 
                            ? 'text-carcare-cyan-400' 
                            : currentTheme === 'dark' ? 'text-white/60' : 'text-gray-400'
                        }`} />
                      ) : (
                        <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                          focusedField === 'email' 
                            ? 'text-carcare-cyan-400' 
                            : currentTheme === 'dark' ? 'text-white/60' : 'text-gray-400'
                        }`} />
                      )}
                      
                      <motion.input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${
                          focusedField === 'email'
                            ? 'border-carcare-cyan-400 shadow-lg shadow-carcare-cyan-400/30 bg-white'
                            : 'border-slate-400/50 bg-white'
                        } ${
                          'text-gray-800 placeholder-gray-500'
                        } focus:outline-none`}
                        placeholder={userType === 'client' ? 'votre@email.com' : 'agent@carcare.com'}
                        whileFocus={{ scale: 1.02 }}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                <motion.div
                  variants={itemVariants}
                  className="relative"
                >
                  <label className={`block text-sm font-medium mb-3 ${
                    currentTheme === 'dark' ? 'text-white/90' : 'text-gray-700'
                  }`}>
                    Mot de passe
                  </label>
                  
                  <div className="relative">
                    {/* Particules magiques pour le mot de passe */}
                    <AnimatePresence>
                      {focusedField === 'password' && fieldParticles.map(particle => (
                        <motion.div
                          key={particle.id}
                          className="absolute w-1 h-1 bg-purple-400 rounded-full"
                          style={{
                            top: '50%',
                            left: '15%',
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            x: Math.cos(particle.angle) * 30,
                            y: Math.sin(particle.angle) * 30,
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            delay: particle.delay,
                            ease: "easeOut"
                          }}
                        />
                      ))}
                    </AnimatePresence>

                    <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                      focusedField === 'password' 
                        ? 'text-purple-400' 
                        : currentTheme === 'dark' ? 'text-white/60' : 'text-gray-400'
                    }`} />
                    
                    <motion.input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-12 pr-14 py-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${
                        focusedField === 'password'
                          ? 'border-purple-400 shadow-lg shadow-purple-400/30 bg-white'
                          : 'border-slate-400/50 bg-white'
                      } ${
                        focusedField === 'password'
                          ? 'text-gray-800 placeholder-gray-600'
                          : 'text-gray-800 placeholder-gray-600'
                      } focus:outline-none`}
                      placeholder="••••••••"
                      whileFocus={{ scale: 1.02 }}
                    />
                    
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                        currentTheme === 'dark' ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Lien mot de passe oublié */}
              <motion.div 
                className="flex justify-end mt-6"
                variants={itemVariants}
              >
                <motion.button 
                  className="text-carcare-cyan-400 text-sm font-medium hover:text-carcare-cyan-300 transition-colors relative py-2 px-1 min-h-[44px]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Récupérer le mot de passe oublié"
                >
                  Mot de passe oublié ?
                  <motion.div
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-carcare-cyan-400 origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </motion.div>

              {/* Bouton de connexion révolutionnaire */}
              <motion.div
                className="mt-8"
                variants={itemVariants}
              >
                <motion.button
                  onClick={handleLogin}
                  disabled={loading || authLoading || (!email || !password)}
                  className={`w-full relative overflow-hidden py-4 rounded-2xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] flex items-center justify-center ${
                    currentTheme === 'dark'
                      ? 'bg-gradient-to-r from-carcare-cyan-500 to-carcare-cyan-600 text-white shadow-lg shadow-carcare-cyan-500/30'
                      : 'bg-gradient-to-r from-carcare-cyan-400 to-carcare-cyan-500 text-white shadow-lg shadow-carcare-cyan-400/30'
                  }`}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 20px 40px rgba(0, 191, 255, 0.4)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Effet de vague au survol */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  
                  <div className="relative z-10 flex items-center justify-center space-x-3">
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          className="flex items-center space-x-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <motion.div
                            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Connexion magique...</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          className="flex items-center space-x-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Zap className="w-6 h-6" />
                          <span>Se connecter</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              </motion.div>

              {/* Séparateur stylé */}
              <motion.div 
                className="flex items-center my-8"
                variants={itemVariants}
              >
                <div className={`flex-1 h-px ${
                  currentTheme === 'dark' ? 'bg-white/20' : 'bg-gray-300'
                }`} />
                <span className={`px-4 text-sm font-medium ${
                  currentTheme === 'dark' ? 'text-white/60' : 'text-gray-500'
                }`}>
                  OU
                </span>
                <div className={`flex-1 h-px ${
                  currentTheme === 'dark' ? 'bg-white/20' : 'bg-gray-300'
                }`} />
              </motion.div>

              {/* Lien d'inscription */}
              <motion.div 
                className="text-center"
                variants={itemVariants}
              >
                <p className={`text-sm ${
                  currentTheme === 'dark' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  Nouveau sur CarCare ?{' '}
                  <motion.button 
                    onClick={() => navigate('/register')}
                    className="text-carcare-cyan-400 font-bold hover:text-carcare-cyan-300 transition-colors relative py-1 px-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Créer un nouveau compte utilisateur"
                  >
                    Créer un compte
                    <motion.div
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-carcare-cyan-400 origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Effet de particules flottantes contextuelles */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-carcare-cyan-500/10 to-transparent" />
    </div>
  );
};

export default LoginScreen;