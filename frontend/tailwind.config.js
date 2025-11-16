/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				// CarCare Palette 2025 - Basée sur le logo
				carcare: {
					cyan: {
						50: '#e0f7ff',
						100: '#b3efff',
						200: '#80e5ff',
						300: '#4dd9ff',
						400: '#1accff',
						500: '#00bfff', // Cyan principal
						600: '#1e90ff', // Cyan secondaire
						700: '#0080e6',
						800: '#0066cc',
						900: '#004d99',
					},
					red: {
						500: '#dc143c', // Rouge bordeaux logo
						600: '#b91c2c',
					},
					silver: {
						400: '#c0c0c0', // Gris métallique
						500: '#808080',
						600: '#606060',
					},
					marine: {
						900: '#0f1419', // Bleu marine foncé
						800: '#1a202c',
						700: '#2d3748',
					},
				},
				// Radix colors adaptées
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#00bfff', // CarCare cyan
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: '#1e90ff', // CarCare cyan secondaire
					foreground: 'hsl(var(--secondary-foreground))',
				},
				accent: {
					DEFAULT: '#dc143c', // CarCare rouge
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			// Glassmorphism & animations 2025
			backdropBlur: {
				xs: '2px',
				sm: '4px',
				md: '8px',
				lg: '12px',
				xl: '16px',
				'2xl': '24px',
				'3xl': '40px',
			},
			boxShadow: {
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
				'glass-sm': '0 2px 16px 0 rgba(31, 38, 135, 0.20)',
				'glass-lg': '0 16px 64px 0 rgba(31, 38, 135, 0.50)',
				'neuro-light': '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
				'neuro-dark': '8px 8px 16px #1a1a1a, -8px -8px 16px #2e2e2e',
				'bubble': '0 4px 15px 0 rgba(0, 191, 255, 0.35)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				// Animations originales Radix
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				// Animations CarCare 2025
				'bubble-float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' },
				},
				'bubble-rise': {
					'0%': { transform: 'translateY(100px)', opacity: '0' },
					'50%': { opacity: '1' },
					'100%': { transform: 'translateY(-100px)', opacity: '0' },
				},
				'water-ripple': {
					'0%': { transform: 'scale(0)', opacity: '1' },
					'100%': { transform: 'scale(4)', opacity: '0' },
				},
				'glass-shine': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' },
				},
				'soap-particle': {
					'0%': { transform: 'rotate(0deg) translateX(0px) rotate(0deg)', opacity: '1' },
					'100%': { transform: 'rotate(360deg) translateX(30px) rotate(-360deg)', opacity: '0' },
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 5px rgba(0, 191, 255, 0.5)' },
					'50%': { boxShadow: '0 0 20px rgba(0, 191, 255, 0.8), 0 0 30px rgba(0, 191, 255, 0.6)' },
				},
			},
			animation: {
				// Animations originales
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				// Animations CarCare 2025
				'bubble-float': 'bubble-float 3s ease-in-out infinite',
				'bubble-rise': 'bubble-rise 4s linear infinite',
				'water-ripple': 'water-ripple 1.5s ease-out infinite',
				'glass-shine': 'glass-shine 2s ease-in-out infinite',
				'soap-particle': 'soap-particle 6s linear infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}