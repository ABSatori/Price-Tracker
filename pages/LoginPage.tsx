
import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (userType: string) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const predefinedUsers = {
    'gmora@duccio.mx': { password: 'admin', type: 'Admin' },
    'dgomez@duccio.mx': { password: 'user', type: 'User' },
    'su@satoritech.dev': { password: 'SatoriTechD', type: 'SuperuserAccess' } 
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const userEmail = email.toLowerCase();
    const user = predefinedUsers[userEmail as keyof typeof predefinedUsers];
    if (user && user.password === password) {
      onLoginSuccess(user.type);
    } else {
      setError('Correo electrónico o contraseña incorrectos.');
    }
  };

  const imageUrl = "https://raw.githubusercontent.com/ABoldCodeU/imagenes-para-proyectos/0bffcce064f89b852d174af8bf84beb767c0c5da/imagenes/Captura%20de%20pantalla%202025-05-21%201857102.png";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background dark:bg-slate-800">
      <div className="w-full max-w-5xl h-[80vh] max-h-[700px] bg-card dark:bg-slate-700 shadow-2xl rounded-xl flex overflow-hidden">
        <div className="hidden md:block md:w-1/2 h-full">
          <img
            src={imageUrl}
            alt="Price Tracker Visual"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 sm:p-10">
          <div className="w-full max-w-xs">
            <h1 className="text-3xl font-bold text-center mb-2 text-textHeader dark:text-slate-100">INICIAR SESIÓN</h1>
            <p className="text-center text-textMuted dark:text-slate-400 mb-8 text-sm">¡Bienvenido a Price Tracker!</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-textMuted dark:text-slate-300 mb-1">Correo electrónico</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input-border dark:border-slate-500 rounded-md bg-input-bg dark:bg-slate-600 text-textHeader dark:text-slate-100 placeholder-textMuted dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-input-focus-ring dark:focus:ring-primary focus:border-transparent"
                  placeholder="su@correo.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-textMuted dark:text-slate-300 mb-1">Contraseña</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input-border dark:border-slate-500 rounded-md bg-input-bg dark:bg-slate-600 text-textHeader dark:text-slate-100 placeholder-textMuted dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-input-focus-ring dark:focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <div className="bg-red-100 dark:bg-red-900 dark:bg-opacity-30 border border-red-300 dark:border-red-700 rounded-md p-2.5">
                  <p className="text-sm text-red-600 dark:text-red-300 text-center">{error}</p>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-custom hover:bg-opacity-90 text-white font-semibold py-2.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-custom focus:ring-offset-1 dark:focus:ring-offset-slate-700"
              >
                Iniciar sesión
              </button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-xs text-textMuted dark:text-slate-500">&copy; {new Date().getFullYear()} SatoriTech. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;