import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as bcrypt from 'bcryptjs';
import { getModelFileFromHex } from '@/lib/penguinColors';

interface LoginFormProps {
  onBack: () => void;
  onSuccess: (data: {
    id: string;
    name: string;
    modelFile: string;
  }) => void;
}

const LoginForm = ({ onBack, onSuccess }: LoginFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Query the users table for the penguin name
      const { data: user, error: queryError } = await supabase
        .from('users')
        .select('id, penguin_name, password_hash, penguin_color')
        .eq('penguin_name', formData.name)
        .single();

      if (queryError || !user) {
        setError('Penguin not found!');
        setIsLoading(false);
        return;
      }

      // Verify the password
      const passwordMatch = await bcrypt.compare(formData.password, user.password_hash);
      
      if (!passwordMatch) {
        setError('Incorrect password!');
        setIsLoading(false);
        return;
      }

      // Success! Pass the user data back
      // Add # back to hex color before converting to model
      const hexColor = user.penguin_color.startsWith('#') ? user.penguin_color : '#' + user.penguin_color;
      
      onSuccess({
        id: user.id,
        name: user.penguin_name,
        modelFile: getModelFileFromHex(hexColor) // Convert hex to model file
      });
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ 
        background: 'radial-gradient(circle at center, #4A90E2 0%, #357ABD 30%, #2E5B8A 60%, #254470 100%)',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important'
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-8 py-16">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* LOCKED TEXTBOX ALIGNMENT - DO NOT MODIFY THESE POSITIONS */}
          {/* Penguin Name - PERFECTLY ALIGNED */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <label className="text-black font-normal text-lg" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important', width: '180px', textAlign: 'right', paddingRight: '10px', whiteSpace: 'nowrap' }}>
              Penguin Name:
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="px-4 py-3 bg-white border-2 border-gray-600 text-black text-base focus:border-blue-500 focus:outline-none"
              style={{ width: '350px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important' }}
              required
              disabled={isLoading}
            />
          </div>

          {/* Password - PERFECTLY ALIGNED */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <label className="text-black font-normal text-lg" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important', width: '180px', textAlign: 'right', paddingRight: '10px', whiteSpace: 'nowrap' }}>
              Password:
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="px-4 py-3 bg-white border-2 border-gray-600 text-black text-base focus:border-blue-500 focus:outline-none"
              style={{ width: '350px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important' }}
              required
              disabled={isLoading}
            />
          </div>
          {/* END LOCKED TEXTBOX ALIGNMENT */}

          {/* Remember checkboxes */}
          <div className="space-y-3 mt-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div style={{ width: '180px', paddingRight: '10px' }}></div>
              <div className="flex items-center gap-2" style={{ width: '350px' }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 border-2 border-gray-400 rounded bg-white"
                />
                <label htmlFor="rememberMe" className="text-black font-normal text-base" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important' }}>
                  Remember me on this computer
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div style={{ width: '180px', paddingRight: '10px' }}></div>
              <div className="flex items-center gap-2" style={{ width: '350px' }}>
                <input
                  type="checkbox"
                  id="rememberPassword"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  className="w-4 h-4 border-2 border-gray-400 rounded bg-white"
                />
                <label htmlFor="rememberPassword" className="text-black font-normal text-base" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important' }}>
                  Remember my password
                </label>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-700 text-center mt-4">
              {error}
            </div>
          )}

          {/* Login Button with Sticky Note */}
          <div className="flex justify-center items-center mt-8" style={{ position: 'relative' }}>
            <button
              type="submit"
              disabled={isLoading}
              className="hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ 
                background: 'transparent',
                border: 'none',
                padding: 0
              }}
            >
              {isLoading ? (
                <div className="px-12 py-3 rounded-full text-white font-normal text-lg bg-gray-500" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important' }}>
                  Logging in...
                </div>
              ) : (
                <img 
                  src="/loginbutton2.png" 
                  alt="Login" 
                  className="w-auto h-20"
                  style={{ cursor: 'pointer' }}
                />
              )}
            </button>
            
            {/* Sticky Note - LOCKED POSITION */}
            <img 
              src="/passecret.png" 
              alt="Keep your password a secret" 
              style={{ 
                position: 'absolute',
                right: '-250px',
                top: '-20px',
                width: '300px',
                height: 'auto',
                transform: 'rotate(-5deg)',
                zIndex: 10
              }}
            />
          </div>
        </form>

        {/* Forgot password link */}
        <div className="text-center mt-6">
          <button className="text-white font-normal text-base hover:underline" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important' }}>
            Forgot your password?
          </button>
        </div>

        {/* Create account section */}
        <div className="text-center mt-8">
          <p className="text-black font-normal text-base mb-2" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important' }}>Don't have a penguin?</p>
          <button
            onClick={onBack}
            className="text-white font-normal text-base hover:underline"
            style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important' }}
          >
            Create a free account now
          </button>
        </div>

        {/* Back button */}
        <div className="text-center mt-12">
          <button
            onClick={onBack}
            className="text-white font-normal text-base hover:underline"
            style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important', fontWeight: 'normal !important' }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;