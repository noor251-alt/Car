import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Users, 
  Car, 
  BarChart3, 
  Shield, 
  LogOut,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Activity,
  Database,
  Globe
} from 'lucide-react';

interface AdminScreenProps {
  onBack: () => void;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mot de passe simple pour la démo
  const ADMIN_PASSWORD = 'carcare-admin-2025';

  const handleLogin = async () => {
    if (!password) {
      setLoginError('Veuillez entrer un mot de passe');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    // Simulation d'authentification
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setLoginError('Mot de passe incorrect');
        setIsLoading(false);
        setPassword('');
      }
    }, 1500);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setLoginError('');
  };

  const adminStats = [
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Utilisateurs Actifs',
      value: '1,247',
      change: '+12% ce mois',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Car className="w-6 h-6" />,
      label: 'Services Réalisés',
      value: '3,891',
      change: '+8% cette semaine',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      label: 'Revenus Mensuels',
      value: '24,580€',
      change: '+15% vs mois dernier',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Activity className="w-6 h-6" />,
      label: 'Taux de Satisfaction',
      value: '98.5%',
      change: '+2.3% amélioration',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const recentActivities = [
    {
      user: 'Jean Dupont',
      action: 'A réservé un service de lavage premium',
      time: 'Il y a 5 minutes',
      type: 'booking'
    },
    {
      user: 'Marie Martin',
      action: 'A créé un compte client',
      time: 'Il y a 12 minutes',
      type: 'register'
    },
    {
      user: 'Pierre Durand',
      action: 'A modifié sa réservation',
      time: 'Il y a 18 minutes',
      type: 'update'
    },
    {
      user: 'Sophie Laurent',
      action: 'A évalué son service 5 étoiles',
      time: 'Il y a 25 minutes',
      type: 'review'
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800" />
        
        {/* Particles d'arrière-plan */}
        <div className="absolute inset-0">
          {Array.from({ length: 25 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          className="relative z-10 w-full max-w-md"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <motion.button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-glass hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            
            <div>
              <h1 className="text-2xl font-bold text-white">
                Administration
              </h1>
              <p className="text-white/70">
                Accès restreint - CarCare Admin
              </p>
            </div>
          </div>

          {/* Formulaire de connexion */}
          <motion.div
            className="p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-glass"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Authentification Requise
              </h2>
              <p className="text-white/70">
                Cette zone est réservée aux administrateurs CarCare
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Mot de passe administrateur
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border-2 bg-white/10 backdrop-blur-sm transition-all duration-300 ${
                      loginError 
                        ? 'border-red-400' 
                        : 'border-white/20 focus:border-red-400'
                    } text-white placeholder-white/50 focus:outline-none`}
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {loginError && (
                  <div className="flex items-center space-x-1 mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{loginError}</span>
                  </div>
                )}
              </div>

              <motion.button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Vérification...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Accéder au Panel</span>
                  </div>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800" />
      
      {/* Particles d'arrière-plan */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-glass hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  CarCare Administration
                </h1>
                <p className="text-white/70 text-sm">
                  Panel de contrôle administrateur
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-white font-medium">Admin Principal</p>
              <p className="text-white/70 text-sm">Connecté maintenant</p>
            </div>
            <motion.button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-400 hover:bg-red-500/30 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {adminStats.map((stat, index) => (
            <motion.div
              key={index}
              className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-glass"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-white/70 text-sm">
                    {stat.label}
                  </p>
                </div>
              </div>
              <p className="text-green-400 text-sm font-medium">
                {stat.change}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activités récentes */}
          <motion.div
            className="lg:col-span-2 p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-glass"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Activité Récente</span>
            </h3>
            
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'booking' ? 'bg-green-500/20 text-green-400' :
                    activity.type === 'register' ? 'bg-blue-500/20 text-blue-400' :
                    activity.type === 'update' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {activity.type === 'booking' && <Car className="w-5 h-5" />}
                    {activity.type === 'register' && <Users className="w-5 h-5" />}
                    {activity.type === 'update' && <Settings className="w-5 h-5" />}
                    {activity.type === 'review' && <CheckCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.user}</p>
                    <p className="text-white/70 text-sm">{activity.action}</p>
                  </div>
                  <p className="text-white/50 text-sm">{activity.time}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* État du système */}
          <motion.div
            className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-glass"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>État du Système</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white">Base de données</span>
                </div>
                <span className="text-green-400 text-sm font-medium">Opérationnel</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white">Serveur API</span>
                </div>
                <span className="text-green-400 text-sm font-medium">Opérationnel</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-white">Services de paiement</span>
                </div>
                <span className="text-yellow-400 text-sm font-medium">Maintenance</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center space-x-3">
                  <Globe className="w-3 h-3 text-green-400" />
                  <span className="text-white">Site Web</span>
                </div>
                <span className="text-green-400 text-sm font-medium">En ligne</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;