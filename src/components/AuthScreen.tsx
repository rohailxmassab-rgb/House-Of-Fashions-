import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Github, Chrome as Google } from 'lucide-react';
import { useState } from 'react';

interface AuthScreenProps {
  onFinish: () => void;
}

export default function AuthScreen({ onFinish }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-luxury-bg flex flex-col p-8 overflow-y-auto"
    >
      <div className="mt-20 mb-12">
        <h1 className="text-4xl font-display font-medium mb-4">
          {isLogin ? 'Welcome Back' : 'Join the House'}
        </h1>
        <p className="text-gray-500 font-light text-lg">
          {isLogin ? 'Sign in to access your luxury experience.' : 'Create an account to start your journey.'}
        </p>
      </div>

      <div className="space-y-6">
        {!isLogin && (
          <div className="relative">
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full h-16 bg-luxury-surface border border-white/10 rounded-2xl px-6 pt-4 pb-0 text-white placeholder-transparent focus:border-luxury-gold outline-none transition-all peer"
            />
            <label className="absolute left-6 top-5 text-gray-500 text-xs transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-6 peer-focus:top-3 peer-focus:text-xs peer-focus:text-luxury-gold pointer-events-none">
              Full Name
            </label>
          </div>
        )}

        <div className="relative">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full h-16 bg-luxury-surface border border-white/10 rounded-2xl px-6 pt-4 pb-0 text-white placeholder-transparent focus:border-luxury-gold outline-none transition-all peer"
          />
          <label className="absolute left-6 top-5 text-gray-500 text-xs transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-6 peer-focus:top-3 peer-focus:text-xs peer-focus:text-luxury-gold pointer-events-none">
            Email Address
          </label>
        </div>

        <div className="relative">
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full h-16 bg-luxury-surface border border-white/10 rounded-2xl px-6 pt-4 pb-0 text-white placeholder-transparent focus:border-luxury-gold outline-none transition-all peer"
          />
          <label className="absolute left-6 top-5 text-gray-500 text-xs transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-6 peer-focus:top-3 peer-focus:text-xs peer-focus:text-luxury-gold pointer-events-none">
            Password
          </label>
        </div>

        {isLogin && (
          <button className="text-luxury-gold text-xs font-bold uppercase tracking-widest text-right w-full">
            Forgot Password?
          </button>
        )}

        <button 
          onClick={onFinish}
          className="w-full h-16 bg-white text-black rounded-2xl font-display font-bold uppercase tracking-widest text-sm hover:bg-luxury-gold transition-all flex items-center justify-center gap-3"
        >
          {isLogin ? 'Sign In' : 'Create Account'}
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="mt-12 flex flex-col items-center">
        <div className="flex items-center gap-4 w-full mb-8">
          <div className="h-[1px] bg-white/10 flex-1" />
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Or continue with</span>
          <div className="h-[1px] bg-white/10 flex-1" />
        </div>

        <div className="flex gap-4 w-full">
          <button className="flex-1 h-14 rounded-2xl bg-luxury-surface border border-white/5 flex items-center justify-center hover:bg-white/5 transition-all">
            <Google size={20} className="text-white" />
          </button>
          <button className="flex-1 h-14 rounded-2xl bg-luxury-surface border border-white/5 flex items-center justify-center hover:bg-white/5 transition-all">
            <Github size={20} className="text-white" />
          </button>
        </div>

        <p className="mt-10 text-gray-500 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-luxury-gold font-bold transition-all hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </motion.div>
  );
}
