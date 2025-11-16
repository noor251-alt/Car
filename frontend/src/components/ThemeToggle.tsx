import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  fixed?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'top-left';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  fixed = true, 
  position = 'top-right' 
}) => {
  const { theme, setTheme, currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const handleThemeChange = () => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'auto', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const handleToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'auto':
        return currentTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Clair';
      case 'dark':
        return 'Sombre';
      case 'auto':
        return 'Auto';
    }
  };

  const getThemeColor = () => {
    switch (currentTheme) {
      case 'light':
        return 'from-yellow-400 to-orange-500';
      case 'dark':
        return 'from-blue-600 to-purple-700';
    }
  };

  return (
    <>
      {/* Languette collée à droite */}
      <motion.div 
        className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50"
        style={{ marginTop: 'max(2rem, env(safe-area-inset-top))' }}
      >
        <motion.button
          onClick={handleToggleClick}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className={`relative p-3 rounded-l-2xl backdrop-blur-xl border border-white/20 shadow-glass transition-all duration-300 ${
            currentTheme === 'dark' 
              ? 'bg-gray-900/40 text-white hover:bg-gray-800/50' 
              : 'bg-white/40 text-gray-800 hover:bg-white/50'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Animation de la flèche */}
          <motion.div
            animate={{ 
              rotate: isOpen ? 180 : 0,
              x: isOpen ? -2 : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
          
          {/* Indicateur de thème actuel */}
          <motion.div
            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full"
            style={{
              background: currentTheme === 'dark' 
                ? 'linear-gradient(45deg, #60a5fa, #a78bfa)' 
                : 'linear-gradient(45deg, #fbbf24, #f97316)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.button>
      </motion.div>

      {/* Drawer coulissant */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed right-0 top-0 h-full w-80 z-40"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className={`h-full backdrop-blur-xl border-l border-white/20 shadow-2xl ${
              currentTheme === 'dark' 
                ? 'bg-gray-900/90 text-white' 
                : 'bg-white/90 text-gray-800'
            }`}>
              <div className="p-6">
                {/* Header du drawer */}
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold">Thème</h3>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className={`p-2 rounded-lg ${
                      currentTheme === 'dark' 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Sélecteur de thème */}
                <div className="space-y-4">
                  {['light', 'auto', 'dark'].map((themeOption) => (
                    <motion.button
                      key={themeOption}
                      onClick={() => {
                        setTheme(themeOption as 'light' | 'dark' | 'auto');
                        if (themeOption === theme) {
                          setIsOpen(false);
                        }
                      }}
                      className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 ${
                        theme === themeOption
                          ? currentTheme === 'dark'
                            ? 'border-blue-500 bg-blue-900/30'
                            : 'border-blue-500 bg-blue-50'
                          : currentTheme === 'dark'
                            ? 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl">
                          {themeOption === 'light' && <Sun className="w-5 h-5" />}
                          {themeOption === 'dark' && <Moon className="w-5 h-5" />}
                          {themeOption === 'auto' && (
                            <div className="relative">
                              <Sun className="w-5 h-5" />
                              <Moon className="w-3 h-3 absolute -bottom-1 -right-1" />
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-medium capitalize">{getThemeLabelForOption(themeOption)}</div>
                          <div className="text-sm opacity-70">
                            {getDescriptionForTheme(themeOption)}
                          </div>
                        </div>
                        {theme === themeOption && (
                          <motion.div
                            className="ml-auto w-3 h-3 rounded-full"
                            style={{
                              background: currentTheme === 'dark' 
                                ? 'linear-gradient(45deg, #60a5fa, #a78bfa)' 
                                : 'linear-gradient(45deg, #fbbf24, #f97316)',
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 15, stiffness: 300 }}
                          />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Informations sur le thème actuel */}
                <div className={`mt-8 p-4 rounded-2xl ${
                  currentTheme === 'dark' 
                    ? 'bg-gray-800/50 border border-gray-700' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="text-sm font-medium mb-2">Thème actuel</div>
                  <div className="flex items-center space-x-2">
                    {getThemeIcon()}
                    <span className="text-sm">
                      {theme === 'auto' 
                        ? `Auto (${currentTheme === 'dark' ? 'Sombre' : 'Clair'})` 
                        : getThemeLabel()
                      }
                    </span>
                    {theme === 'auto' && (
                      <div className="ml-auto flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-500">Auto</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay pour fermer le drawer en cliquant à l'extérieur */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );

  function getThemeLabelForOption(option: string) {
    switch (option) {
      case 'light': return 'Clair';
      case 'dark': return 'Sombre';
      case 'auto': return 'Automatique';
      default: return option;
    }
  }

  function getDescriptionForTheme(option: string) {
    switch (option) {
      case 'light': return 'Thème clair pour le jour';
      case 'dark': return 'Thème sombre pour la nuit';
      case 'auto': return 'Suit le système';
      default: return '';
    }
  }
};

export default ThemeToggle;