import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Wifi, WifiOff, Smartphone, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAManager: React.FC = () => {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swUpdate, setSwUpdate] = useState<ServiceWorkerRegistration | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Détection de l'état d'installation PWA
  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstalled();

    // Écouter les changements de mode d'affichage
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addListener(checkInstalled);

    return () => mediaQuery.removeListener(checkInstalled);
  }, []);

  // Gestion de l'événement beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Afficher le prompt après un délai pour améliorer l'UX
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 10000); // Attendre 10 secondes avant de proposer l'installation
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isInstalled]);

  // Gestion du statut réseau
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Gestion des mises à jour du Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Écouter les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setSwUpdate(registration);
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      });

      // Écouter les messages du service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SW_UPDATED') {
          setShowUpdatePrompt(true);
        }
      });
    }
  }, []);

  // Installation de l'application
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('🎉 CarCare installé avec succès');
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('❌ Erreur installation PWA:', error);
    }
  };

  // Mise à jour de l'application
  const handleUpdate = () => {
    if (swUpdate?.waiting) {
      swUpdate.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Animation des notifications
  const notificationVariants = {
    hidden: { 
      opacity: 0, 
      y: -100, 
      scale: 0.3,
      rotateX: -90
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: { 
      opacity: 0, 
      y: -100, 
      scale: 0.3,
      rotateX: -90,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <>
      {/* Indicateur de statut réseau */}
      <motion.div
        className={`fixed top-4 left-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-xl backdrop-blur-md border transition-all duration-300 ${
          isOnline
            ? 'bg-green-500/20 border-green-500/30 text-green-600'
            : `${theme === 'dark' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-red-500/20 border-red-500/30 text-red-600'}`
        }`}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: isOnline ? 0 : 1, x: isOnline ? -50 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      </motion.div>

      {/* Prompt d'installation PWA */}
      <AnimatePresence>
        {showInstallPrompt && !isInstalled && (
          <motion.div
            className="fixed top-6 right-6 z-50 max-w-sm"
            variants={notificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className={`backdrop-blur-xl rounded-3xl border p-6 shadow-2xl ${
              theme === 'dark'
                ? 'bg-slate-800/50 border-slate-700/50'
                : 'bg-white/50 border-white/50'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-carcare-cyan-400 to-carcare-cyan-600 rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      Installer CarCare
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>
                      Application CarCare
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowInstallPrompt(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-slate-700' 
                      : 'hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`} />
                </motion.button>
              </div>
              
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>
                Installez CarCare pour une expérience optimale avec mode hors ligne et notifications.
              </p>
              
              <div className="flex space-x-3">
                <motion.button
                  onClick={handleInstall}
                  className="flex-1 bg-gradient-to-r from-carcare-cyan-500 to-carcare-cyan-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  <span>Installer</span>
                </motion.button>
                
                <motion.button
                  onClick={() => setShowInstallPrompt(false)}
                  className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Plus tard
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt de mise à jour */}
      <AnimatePresence>
        {showUpdatePrompt && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 max-w-sm"
            variants={notificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className={`backdrop-blur-xl rounded-3xl border p-6 shadow-2xl ${
              theme === 'dark'
                ? 'bg-slate-800/50 border-slate-700/50'
                : 'bg-white/50 border-white/50'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      Mise à jour disponible
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>
                      Nouvelle version de CarCare
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowUpdatePrompt(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-slate-700' 
                      : 'hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`} />
                </motion.button>
              </div>
              
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>
                Une nouvelle version avec des améliorations est prête. Redémarrez pour l'activer.
              </p>
              
              <div className="flex space-x-3">
                <motion.button
                  onClick={handleUpdate}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Redémarrer</span>
                </motion.button>
                
                <motion.button
                  onClick={() => setShowUpdatePrompt(false)}
                  className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Plus tard
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge PWA installée */}
      {isInstalled && (
        <motion.div
          className="fixed bottom-4 left-4 z-40"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <div className={`backdrop-blur-md rounded-full px-3 py-2 flex items-center space-x-2 border ${
            theme === 'dark'
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : 'bg-green-500/20 border-green-500/30 text-green-600'
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium">App installée</span>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default PWAManager;