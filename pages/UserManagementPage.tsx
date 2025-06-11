
import React, { useState } from 'react';
import Card from '../components/common/Card';
import ToggleSwitch from '../components/common/ToggleSwitch';
import { SearchIcon, PencilIcon, FilterIcon, PlusCircleIcon } from '../components/icons/FeatureIcons';
import { User } from '../types';

const initialUsers: User[] = [
  { id: '1', name: 'G Mora', email: 'gmora@duccio.mx', profile: 'Administrador', isActive: true },
  { id: '2', name: 'D Gomez', email: 'dgomez@duccio.mx', profile: 'Usuario', isActive: true },
  { id: '3', name: 'Satori Tech', email: 'su@satoritech.dev', profile: 'Superusuario', isActive: false },
];

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleToggleActive = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      )
    );
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-textHeader dark:text-slate-100">Gestión de Usuarios</h2>
        <button
          onClick={() => alert('Funcionalidad "Agregar usuario" (Próximamente)')}
          className="flex items-center px-4 py-2 bg-primary hover:bg-opacity-90 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary dark:focus:ring-offset-slate-800"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Agregar usuario
        </button>
      </div>
      
      <Card> {/* Card already handles its dark mode background and border */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:w-auto sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, correo o perfil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-input-bg dark:bg-slate-600 border border-input-border dark:border-slate-500 rounded-full text-sm placeholder-textMuted dark:placeholder-slate-400 text-textHeader dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-input-focus-ring dark:focus:ring-primary focus:border-input-focus-ring dark:focus:border-primary"
              />
            </div>
            <button 
                aria-label="Filtrar usuarios"
                onClick={() => alert('Funcionalidad "Filtrar usuarios" (Próximamente)')}
                className="p-2.5 text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary rounded-md hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
            >
                <FilterIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-slate-600">
                <tr>
                  {["Nombre", "Correo electrónico", "Perfil", "Estado", "Acciones"].map(header => (
                    <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card dark:bg-slate-700 divide-y divide-contentBorder dark:divide-slate-600">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-textHeader dark:text-slate-100">{user.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted dark:text-slate-300">{user.email}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted dark:text-slate-300">{user.profile}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <ToggleSwitch 
                        id={`user-toggle-${user.id}`} 
                        checked={user.isActive} 
                        onChange={() => handleToggleActive(user.id)} 
                      />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => alert(`Editar usuario ${user.name} (Próximamente)`)}
                        aria-label={`Editar usuario ${user.name}`}
                        className="text-textMuted dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                    <tr>
                        <td colSpan={5} className="text-center py-8 text-textMuted dark:text-slate-400">
                            No se encontraron usuarios que coincidan con la búsqueda.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserManagementPage;