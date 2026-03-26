import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Send,
  Users,
  History,
  MessageCircle,
  LogOut,
  Sun,
  Moon,
  UserCog,
  User,
  Mail,
  Building2,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  X,
  Pencil,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { userService } from "@/services/userService";
import { HOSPITALS } from "@/types";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Disparo Individual",
    href: "/individual",
    icon: Send,
  },
  {
    name: "Disparo em Massa",
    href: "/bulk",
    icon: Users,
  },
  {
    name: "Histórico",
    href: "/history",
    icon: History,
  },
];

const adminNavigation = [
  {
    name: "Cadastro de Templates",
    href: "/templates",
    icon: FileText,
  },
  {
    name: "Usuários",
    href: "/users",
    icon: UserCog,
  },
];

export default function Sidebar() {
  const { user, logout, isAdmin, userHospitals } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  // Profile modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get hospital names for display
  const getHospitalNames = (): string => {
    if (isAdmin) return "Todos os hospitais";
    if (userHospitals.length === 0) return "Nenhum hospital";
    return userHospitals
      .map((id) => HOSPITALS.find((h) => h.id === id)?.name || id)
      .join(", ");
  };

  // Open profile modal
  const handleOpenProfile = () => {
    setNewName(user?.name || "");
    setIsEditingName(false);
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsProfileOpen(true);
  };

  // Close profile modal
  const handleCloseProfile = () => {
    setIsProfileOpen(false);
    setIsEditingName(false);
    setIsChangingPassword(false);
  };

  // Save name
  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;

    if (newName.trim().length < 2) {
      toast.error("Nome deve ter pelo menos 2 caracteres");
      return;
    }

    try {
      setSaving(true);
      const success = await userService.updateProfile(user.id, newName.trim());

      if (success) {
        // Update local user state by reloading the page
        toast.success("Nome atualizado com sucesso!");
        setIsEditingName(false);
        // Reload to refresh user data
        window.location.reload();
      } else {
        toast.error("Erro ao atualizar nome");
      }
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Erro ao atualizar nome");
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!user) return;

    // Validations
    if (!currentPassword) {
      toast.error("Digite a senha atual");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("A nova senha deve ser diferente da atual");
      return;
    }

    try {
      setSaving(true);

      // Verify current password
      const isValid = await userService.verifyPassword(user.id, currentPassword);
      if (!isValid) {
        toast.error("Senha atual incorreta");
        return;
      }

      // Change password
      const success = await userService.changePassword(user.id, newPassword);

      if (success) {
        toast.success("Senha alterada com sucesso!");
        setIsChangingPassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Erro ao alterar senha");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Erro ao alterar senha");
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-700">
        {" "}
        <div className="w-10 h-10 bg-gradient-to-br from-whatsapp-light to-whatsapp-dark rounded-lg flex items-center justify-center shadow-lg">
          {" "}
          <MessageCircle className="w-6 h-6 text-white" />{" "}
        </div>{" "}
        <div>
          {" "}
          <h1 className="text-center font-bold text-gray-900 dark:text-white">
            SDW
          </h1>{" "}
          <p className=" text-center text-xs text-gray-500 dark:text-gray-400">
            Sistema de Disparo de Whatsapp
          </p>{" "}
        </div>{" "}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="mb-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">
            Menu
          </p>
        </div>
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 ${
                isActive
                  ? "bg-whatsapp-light/10 dark:bg-whatsapp-light/20 text-whatsapp-dark dark:text-whatsapp-light font-medium"
                  : ""
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <div className="mt-6 mb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Administração
              </p>
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 ${
                    isActive
                      ? "bg-whatsapp-light/10 dark:bg-whatsapp-light/20 text-whatsapp-dark dark:text-whatsapp-light font-medium"
                      : ""
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="justify-center w-full flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? (
            <>
              <Sun className="w-5 h-5" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              <span>Modo Escuro</span>
            </>
          )}
        </button>

        {/* User Info - Clickable */}
        <button
          onClick={handleOpenProfile}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-whatsapp-light/20 to-whatsapp-dark/20 dark:from-whatsapp-light/30 dark:to-whatsapp-dark/30 rounded-full flex items-center justify-center group-hover:from-whatsapp-light/30 group-hover:to-whatsapp-dark/30 transition-colors">
            <span className="text-sm font-medium text-whatsapp-dark dark:text-whatsapp-light">
              {user ? getInitials(user.name) : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.name || "Usuário"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.role === "admin" ? "Administrador" : "Usuário"}
            </p>
          </div>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseProfile}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-whatsapp-light to-whatsapp-dark rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user ? getInitials(user.name) : "U"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Meu Perfil
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Visualize e edite suas informações
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseProfile}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4" />
                    Nome
                  </label>
                  {!isEditingName && (
                    <button
                      onClick={() => {
                        setNewName(user?.name || "");
                        setIsEditingName(true);
                      }}
                      className="p-1 text-gray-400 hover:text-whatsapp-dark dark:hover:text-whatsapp-light transition-colors"
                      title="Editar nome"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-whatsapp-light text-sm"
                      placeholder="Seu nome"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="p-2 bg-whatsapp-light text-white rounded-lg hover:bg-whatsapp-dark transition-colors disabled:opacity-50"
                      title="Salvar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-gray-900 dark:text-white text-sm">
                    {user?.name || "-"}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-gray-900 dark:text-white text-sm">
                  {user?.email || "-"}
                </p>
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Shield className="w-4 h-4" />
                  Tipo de Usuário
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isAdmin
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {isAdmin ? "Administrador" : "Usuário"}
                  </span>
                </div>
              </div>

              {/* Hospitals Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Building2 className="w-4 h-4" />
                  Hospitais
                </label>
                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-gray-900 dark:text-white text-sm">
                  {getHospitalNames()}
                </p>
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Lock className="w-4 h-4" />
                    Senha
                  </label>
                  {!isChangingPassword && (
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="text-sm text-whatsapp-dark dark:text-whatsapp-light hover:underline"
                    >
                      Alterar senha
                    </button>
                  )}
                </div>

                {isChangingPassword ? (
                  <div className="space-y-3">
                    {/* Current Password */}
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-whatsapp-light text-sm"
                        placeholder="Senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* New Password */}
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-whatsapp-light text-sm"
                        placeholder="Nova senha (mínimo 6 caracteres)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-whatsapp-light text-sm ${
                          confirmPassword && newPassword !== confirmPassword
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="Confirmar nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Password mismatch warning */}
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500">As senhas não coincidem</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-whatsapp-light text-white rounded-lg hover:bg-whatsapp-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? "Salvando..." : "Salvar Senha"}
                      </button>
                      <button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
                    ••••••••
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={handleCloseProfile}
                className="w-full px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
