import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Car, 
  Briefcase, 
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  AlertCircle
} from 'lucide-react';

interface RegisterScreenProps {
  onBack: () => void;
  onLogin: () => void;
}

type UserType = 'client' | 'agent';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  // Champs client
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  // Champs agent
  employeeId: string;
  department: string;
  position: string;
  carModel: string;
  licensePlate: string;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack, onLogin }) => {
  const [userType, setUserType] = useState<UserType>('client');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    employeeId: '',
    department: '',
    position: '',
    carModel: '',
    licensePlate: ''
  });

  const departments = [
    'Administration',
    'Comptabilité',
    'Ressources Humaines',
    'IT',
    'Marketing',
    'Vente',
    'Production',
    'Logistique',
    'Autre'
  ];

  const positions = [
    'Employé',
    'Superviseur',
    'Manager',
    'Directeur',
    'Stagiaire',
    'Consultant',
    'Autre'
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (userType === 'client') {
      if (!formData.firstName) newErrors.firstName = 'Le prénom est requis';
      if (!formData.lastName) newErrors.lastName = 'Le nom est requis';
      if (!formData.phone) newErrors.phone = 'Le téléphone est requis';
      if (!formData.address) newErrors.address = 'L\'adresse est requise';
    } else {
      if (!formData.employeeId) newErrors.employeeId = 'L\'ID employé est requis';
      if (!formData.department) newErrors.department = 'Le département est requis';
      if (!formData.position) newErrors.position = 'Le poste est requis';
      if (!formData.carModel) newErrors.carModel = 'Le modèle de voiture est requis';
      if (!formData.licensePlate) newErrors.licensePlate = 'La plaque d\'immatriculation est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Simulation d'une inscription
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ici vous intégreriez votre logique d'inscription réelle
      console.log('Registration data:', { userType, ...formData });
      
      // Redirection vers la connexion après inscription réussie
      onLogin();
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderClientForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Prénom
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
                errors.firstName 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
              } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400`}
              placeholder="Votre prénom"
            />
          </div>
          {errors.firstName && (
            <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.firstName}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nom
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
                errors.lastName 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
              } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400`}
              placeholder="Votre nom"
            />
          </div>
          {errors.lastName && (
            <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.lastName}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Téléphone
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
              errors.phone 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
            } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400`}
            placeholder="+33 6 12 34 56 78"
          />
        </div>
        {errors.phone && (
          <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.phone}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Adresse
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
              errors.address 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
            } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400`}
            placeholder="Votre adresse complète"
          />
        </div>
        {errors.address && (
          <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.address}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderAgentForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ID Employé
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={formData.employeeId}
            onChange={(e) => handleInputChange('employeeId', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
              errors.employeeId 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
            } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400`}
            placeholder="EMP-001"
          />
        </div>
        {errors.employeeId && (
          <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.employeeId}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Département
          </label>
          <select
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
              errors.department 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
            } text-gray-900 dark:text-white`}
          >
            <option value="">Sélectionner</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {errors.department && (
            <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.department}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Poste
          </label>
          <select
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
              errors.position 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
            } text-gray-900 dark:text-white`}
          >
            <option value="">Sélectionner</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
          {errors.position && (
            <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.position}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Modèle de Voiture
        </label>
        <div className="relative">
          <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={formData.carModel}
            onChange={(e) => handleInputChange('carModel', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
              errors.carModel 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
            } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400`}
            placeholder="ex: Peugeot 308, Renault Clio..."
          />
        </div>
        {errors.carModel && (
          <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.carModel}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Plaque d'Immatriculation
        </label>
        <div className="relative">
          <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={formData.licensePlate}
            onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
              errors.licensePlate 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
            } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400`}
            placeholder="AB-123-CD"
          />
        </div>
        {errors.licensePlate && (
          <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.licensePlate}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900" />
      
      {/* Particles d'arrière-plan */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 dark:bg-purple-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
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

      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <motion.button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 shadow-glass hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Créer un Compte
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Rejoignez la communauté CarCare
            </p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-2 mb-8 border border-white/20 shadow-glass">
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
        </div>

        {/* Formulaire */}
        <motion.div
          className="p-8 rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 shadow-glass"
          key={userType}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Inscription {userType === 'client' ? 'Client' : 'Agent'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {userType === 'client' 
                ? 'Créez votre compte client pour accéder à nos services' 
                : 'Créez votre compte agent pour accéder aux outils internes'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
                    errors.email 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400`}
                  placeholder="votre@email.com"
                />
              </div>
              {errors.email && (
                <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
                    errors.password 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border-2 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 ${
                    errors.confirmPassword 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-400'
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center space-x-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {/* Champs spécifiques au type d'utilisateur */}
            <AnimatePresence mode="wait">
              <motion.div
                key={userType}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {userType === 'client' ? renderClientForm() : renderAgentForm()}
              </motion.div>
            </AnimatePresence>

            {/* Bouton de soumission */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <span>Inscription en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Check className="w-5 h-5" />
                  <span>Créer mon compte</span>
                </div>
              )}
            </motion.button>
          </form>

          {/* Lien vers la connexion */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Déjà un compte ?{' '}
              <button
                onClick={onLogin}
                className="text-blue-500 dark:text-purple-400 font-medium hover:underline"
              >
                Se connecter
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterScreen;