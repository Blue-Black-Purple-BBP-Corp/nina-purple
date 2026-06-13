import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0510]">
      <div className="max-w-md w-full p-8 glass-card rounded-3xl mx-6 text-center space-y-6">
        <img
          src="https://media.base44.com/images/public/user_6a21c0f76d807658e5c95962/36ab8cc0a_NinaPurpleIcon.png"
          alt="Nina Purple"
          className="w-16 h-16 mx-auto object-contain drop-shadow-[0_0_20px_rgba(123,47,190,0.5)]"
        />
        <div>
          <h1 className="font-serif text-2xl text-[#F0E6FF] mb-3">Access Restricted</h1>
          <p className="text-[#F0E6FF]/60 text-sm leading-relaxed">
            Your account does not have access to Nina Purple. Please contact us to request access or verify you are using the correct account.
          </p>
        </div>
        <div className="space-y-3">
          <a href="mailto:contact@NinaPurple.love"
            className="block w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold text-sm hover:bg-yellow-400 transition-all">
            Contact Us
          </a>
          <button onClick={() => { window.location.href = '/'; }}
            className="block w-full py-3 glass-card rounded-full text-[#F0E6FF]/60 text-sm hover:text-[#F0E6FF] transition-colors">
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;