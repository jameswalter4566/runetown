import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as bcrypt from 'bcryptjs';
import { PENGUIN_COLORS, getModelFileFromHex } from '@/lib/penguinColors';

interface PenguinCreationFormProps {
  onBack: () => void;
  onComplete: (data: {
    name: string;
    color: string;
    modelFile: string;
    password: string;
  }) => void;
}

// Helper function to generate mock mint addresses
const generateMockMintAddress = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const PenguinCreationForm = ({ onBack, onComplete }: PenguinCreationFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#00BCD4' // Default cyan color
  });
  const [walletInfo, setWalletInfo] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [savedWalletInfo, setSavedWalletInfo] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'public' | 'private' | null>(null);
  const [isLaunchingToken, setIsLaunchingToken] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [tokenLaunchComplete, setTokenLaunchComplete] = useState(false);
  const [solscanUrl, setSolscanUrl] = useState<string | null>(null);

  const colorOptions = PENGUIN_COLORS;

  const copyToClipboard = (text: string, field: 'public' | 'private') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Generate wallet on component mount
  useEffect(() => {
    generateWallet();
  }, []);

  const generateWallet = async () => {
    try {
      setIsGeneratingWallet(true);
      const response = await supabase.functions.invoke('generate-wallet', {
        body: { tokenName: 'penguin' }
      });
      
      if (response.error || !response.data.success) {
        throw new Error('Failed to generate wallet');
      }
      
      const { publicKey, privateKey } = response.data;
      setSavedWalletInfo({ publicKey, privateKey });
      setIsGeneratingWallet(false);
    } catch (error) {
      console.error('Error generating wallet:', error);
      // Generate mock wallet as fallback
      setSavedWalletInfo({
        publicKey: generateMockMintAddress(),
        privateKey: generateMockMintAddress()
      });
      setIsGeneratingWallet(false);
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    

    if (formData.name.length < 4 || formData.name.length > 9) {
      alert('Penguin name must be 4-9 characters!');
      return;
    }

    if (!savedWalletInfo) {
      alert('Wallet not generated. Please refresh and try again.');
      return;
    }

    try {
      const { publicKey, privateKey } = savedWalletInfo;
      
      // Use private key as password (hash it)
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(privateKey, salt);

      // Get the model file for the selected color
      const modelFile = getModelFileFromHex(formData.color);

      // Remove # from hex to fit in VARCHAR(7) database column
      const colorWithoutHash = formData.color.substring(1); // Remove the #
      
      console.log('Original color:', formData.color);
      console.log('Color without #:', colorWithoutHash);
      console.log('Length:', colorWithoutHash.length);
      
      // Insert user into Supabase without mint address initially
      const { data, error } = await supabase
        .from('users')
        .insert({
          penguin_name: formData.name,
          password_hash: passwordHash,
          penguin_color: colorWithoutHash, // Store hex without # (6 chars for VARCHAR(7))
          token_mint_address: publicKey,
          wallet_public_address: publicKey,
          wallet_private_key: privateKey
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          alert('This penguin name is already taken!');
        } else {
          alert('Error creating penguin: ' + error.message);
        }
        return;
      }

      // Launch the token with progress tracking
      setIsLaunchingToken(true);
      setLaunchProgress(0);
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setLaunchProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Hold at 90% until actual completion
          }
          return prev + 10;
        });
      }, 500); // Update every 500ms

      try {
        console.log('Launching token for new penguin...');
        
        // Get the penguin preview image and convert to base64
        const penguinColorData = PENGUIN_COLORS.find(c => c.hex === formData.color);
        if (!penguinColorData) {
          throw new Error('Could not find penguin color');
        }
        
        const imageUrl = penguinColorData.previewImage;
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data:image/png;base64, prefix
            resolve(base64String.split(',')[1]);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        const imageBase64 = await base64Promise;

        // Call the edge function to create token
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('create-penguin-token', {
          body: {
            userId: data.id,
            penguinName: formData.name,
            penguinColor: formData.color,
            imageBase64
          }
        });

        clearInterval(progressInterval);
        setLaunchProgress(100);

        if (tokenError) {
          console.error('Token launch error:', tokenError);
          // Still spawn them into the game
          setTimeout(() => {
            handleAutoSpawn();
          }, 1000);
        } else if (tokenData?.success) {
          console.log('Token launched successfully!', tokenData);
          setSolscanUrl(tokenData.solscanUrl);
          setTokenLaunchComplete(true);
          
          // Auto-spawn after showing success
          setTimeout(() => {
            handleAutoSpawn();
          }, 3000); // Show success for 3 seconds
        }
      } catch (error) {
        console.error('Failed to launch token:', error);
        clearInterval(progressInterval);
        setLaunchProgress(100);
        // Still spawn them into the game
        setTimeout(() => {
          handleAutoSpawn();
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating penguin:', error);
      alert('Error creating penguin. Please try again.');
    }
  };

  const handleAutoSpawn = () => {
    const modelFile = getModelFileFromHex(formData.color);
    onComplete({
      name: formData.name,
      color: formData.color,
      modelFile: modelFile,
      password: savedWalletInfo?.privateKey || ''
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: '#87CEEB' }}
    >
      <div 
        className="relative w-full max-w-5xl rounded-3xl p-8 shadow-2xl"
        style={{ 
          backgroundColor: '#E8F4F8',
          border: '8px solid #4BA6FF',
          boxSizing: 'border-box'
        }}
      >
        {/* Club Penguin Logo */}
        <div className="absolute top-6 left-6">
          <img 
            src="/clubpenguintransparentlogo.png" 
            alt="Club Penguin Legacy" 
            className="h-32 object-contain"
          />
        </div>

        <div className="flex items-start gap-8 mt-16">
          {/* Left side - Penguin character and name field */}
          <div className="flex-1">
            <div className="relative">
              {/* Penguin Preview Image */}
              <div className="flex justify-center items-center">
                <img 
                  src={PENGUIN_COLORS.find(c => c.hex === formData.color)?.previewImage || '/penguin-previews/cyan.png'}
                  alt={`${PENGUIN_COLORS.find(c => c.hex === formData.color)?.name || 'Cyan'} Penguin`}
                  className="w-80 h-80 object-contain"
                />
              </div>
              
              {/* Name field under penguin with number 1 to the left */}
              <div className="mt-8 px-8 flex items-start gap-4">
                {/* Step 1 circle */}
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg flex-shrink-0"
                  style={{ backgroundColor: '#4BA6FF', color: 'white' }}
                >
                  1.
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Create Penguin Name:</h3>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter Name"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 text-lg"
                    style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}
                    maxLength={9}
                    required
                  />
                  <div className="mt-2 text-sm" style={{ fontFamily: 'Arial, sans-serif', color: '#666' }}>
                    <p>• 4 - 9 letters, numbers, or spaces</p>
                    <p>• Do not use your real name</p>
                    <p className="text-blue-500 underline cursor-pointer">Click me to read more guidelines</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="flex-1 max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Step 2 - Color */}
              <div className="relative pl-20">
                <div 
                  className="absolute left-0 top-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg"
                  style={{ backgroundColor: '#4BA6FF', color: 'white' }}
                >
                  2.
                </div>
                <h3 className="text-xl font-bold mb-4">Choose Penguin Color:</h3>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((colorOption, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleColorSelect(colorOption.hex)}
                      className={`w-12 h-12 rounded-lg border-4 transition-all ${
                        formData.color === colorOption.hex ? 'border-gray-800 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: colorOption.hex }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>


              {/* Step 3 - Wallet Info */}
              <div className="relative pl-20">
                <div 
                  className="absolute left-0 top-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg"
                  style={{ backgroundColor: '#4BA6FF', color: 'white' }}
                >
                  3.
                </div>
                <h3 className="text-xl font-bold mb-2">Your Penguin Token Wallet:</h3>
                <p className="text-sm text-red-600 font-bold mb-3" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                  (THIS PRIVATE KEY IS YOUR PASSWORD TO LOGIN)
                </p>
                {isGeneratingWallet ? (
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                    <p className="text-center" style={{ fontFamily: "'Comic Sans MS', cursive" }}>Generating wallet...</p>
                  </div>
                ) : savedWalletInfo ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-300">
                      <label className="block text-sm font-bold text-blue-800 mb-1" style={{ fontFamily: "'Bowlby One', cursive" }}>
                        Public Address:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(savedWalletInfo.publicKey, 'public')}
                          className={`p-2 ${copiedField === 'public' ? 'bg-green-500' : 'bg-blue-500'} text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg`}
                          title="Copy public address"
                        >
                          {copiedField === 'public' ? <span className="text-xl font-bold">✓</span> : <Copy size={24} />}
                        </button>
                        <input
                          type="text"
                          value={savedWalletInfo.publicKey}
                          readOnly
                          className="flex-1 bg-white border border-blue-200 rounded px-2 py-1 text-xs font-mono"
                          style={{ fontFamily: "monospace", fontWeight: 400 }}
                        />
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border-2 border-red-300">
                      <label className="block text-sm font-bold text-red-800 mb-1" style={{ fontFamily: "'Bowlby One', cursive" }}>
                        Private Key (SAVE THIS!):
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(savedWalletInfo.privateKey, 'private')}
                          className={`p-2 ${copiedField === 'private' ? 'bg-green-500' : 'bg-red-500'} text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg`}
                          title="Copy private key"
                        >
                          {copiedField === 'private' ? <span className="text-xl font-bold">✓</span> : <Copy size={24} />}
                        </button>
                        <input
                          type="text"
                          value={savedWalletInfo.privateKey}
                          readOnly
                          className="flex-1 bg-white border border-red-200 rounded px-2 py-1 text-xs font-mono"
                          style={{ fontFamily: "monospace", fontWeight: 400 }}
                        />
                      </div>
                      <p className="text-xs text-red-600 mt-1" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                        ⚠️ Save your private key! You'll need it for rewards!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
                    <p className="text-center text-gray-600">Wallet generation failed. Don't worry, one will be created!</p>
                  </div>
                )}
              </div>


              {/* Next Button */}
              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  disabled={isGeneratingWallet}
                  className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: '#4BA6FF', color: 'white' }}
                >
                  {isGeneratingWallet ? 'Creating Penguin...' : 'Create New Penguin'}
                  {!isGeneratingWallet && <ArrowRight className="w-5 h-5 text-white" style={{ color: 'white !important' }} />}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Progress Bar */}
        {isLaunchingToken && (
          <div className="mt-6 px-8">
            <div className="bg-gray-200 rounded-full h-10 overflow-hidden shadow-inner relative">
              <div 
                className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full transition-all duration-500 ease-out"
                style={{ width: `${launchProgress}%` }}
              />
              {/* Text overlay - always centered in the progress bar */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="font-bold text-sm"
                  style={{ 
                    color: launchProgress > 50 ? 'white' : '#333',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    fontFamily: "'Arial', sans-serif"
                  }}
                >
                  {tokenLaunchComplete ? 'Done!' : 'Launching Token on Bonk.fun...'}
                </span>
              </div>
            </div>
            {tokenLaunchComplete && solscanUrl && (
              <div className="mt-2 text-center">
                <a 
                  href={solscanUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 underline text-sm hover:text-blue-700"
                >
                  View on Solscan →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PenguinCreationForm;