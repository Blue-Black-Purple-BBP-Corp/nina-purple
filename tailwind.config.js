/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			// Nina Purple custom tokens
  			void: '#0B0510',
  			veil: '#1F1026',
  			'veil-deep': '#150C1E',
  			'veil-light': '#2D1B3D',
  			sun: '#F5A800',
  			orchid: '#7B2FBE',
  			starlight: '#F0E6FF',
  		},
		fontFamily: {
			heading: ['Playfair Display', 'Georgia', 'serif'],
			body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			display: ['Playfair Display', 'Georgia', 'serif'],
			mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
			serif: ['Playfair Display', 'Georgia', 'serif'],
		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
			'fade-in-up': {
				from: { opacity: '0', transform: 'translateY(30px)' },
				to: { opacity: '1', transform: 'translateY(0)' }
			},
			'fade-in': {
				from: { opacity: '0' },
				to: { opacity: '1' }
			},
			'golden-ripple': {
				'0%': { boxShadow: '0 0 0 0 rgba(245,168,0,0.6)' },
				'100%': { boxShadow: '0 0 0 40px rgba(245,168,0,0)' }
			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
			'fade-in-up': 'fade-in-up 0.6s ease-out',
			'fade-in': 'fade-in 0.6s ease-out',
			'golden-ripple': 'golden-ripple 0.8s ease-out',
  		},
		transitionDuration: {
			'600': '600ms',
		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
