import { NavLink } from 'react-router-dom';
import {
  FileText,
  Send,
  Users,
  History,
  MessageCircle,
} from 'lucide-react';

const navigation = [
  {
    name: 'Cadastro de Templates',
    href: '/templates',
    icon: FileText,
  },
  {
    name: 'Disparo Individual',
    href: '/individual',
    icon: Send,
  },
  {
    name: 'Disparo em Massa',
    href: '/bulk',
    icon: Users,
  },
  {
    name: 'Histórico',
    href: '/history',
    icon: History,
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200">
        <div className="w-10 h-10 bg-whatsapp-light rounded-lg flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900">WhatsApp</h1>
          <p className="text-xs text-gray-500">Sistema de Disparo</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-whatsapp-light/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-whatsapp-dark">HC</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">HECAD</p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
