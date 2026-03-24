import { useState, useEffect, useMemo } from "react";
import {
  RefreshCw,
  User,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { SendingHistory, SendingStatus, SendingType } from "../types";
import { historyService } from "../services/historyService";
import { Button, Table } from "../components/ui";
import Layout from "../components/layout/Layout";

const ITEMS_PER_PAGE_OPTIONS = [10, 50, 100, 500];

export default function HistoryPage() {
  const [history, setHistory] = useState<SendingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | SendingType>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadHistory();
  }, []);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, itemsPerPage]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await historyService.getAll();
      setHistory(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: SendingStatus) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: SendingStatus) => {
    switch (status) {
      case "success":
        return "Sucesso";
      case "failed":
        return "Falhou";
      case "pending":
        return "Pendente";
    }
  };

  const getStatusClass = (status: SendingStatus) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  // Filter data
  const filteredHistory = useMemo(() => {
    return history.filter(
      (item) => filter === "all" || item.sending_type === filter,
    );
  }, [history, filter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Paginated data
  const paginatedHistory = useMemo(() => {
    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, startIndex, endIndex]);

  // Page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const columns = [
    {
      key: "type",
      header: "Tipo",
      render: (item: SendingHistory) => (
        <div className="flex items-center gap-2">
          {item.sending_type === "individual" ? (
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          ) : (
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {item.sending_type === "individual" ? "Individual" : "Em Massa"}
          </span>
        </div>
      ),
    },
    {
      key: "template_name",
      header: "Template",
      render: (item: SendingHistory) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {item.template_name}
        </span>
      ),
    },
    {
      key: "details",
      header: "Detalhes",
      render: (item: SendingHistory) => (
        <div className="text-sm">
          {item.sending_type === "individual" ? (
            <span className="text-gray-600 dark:text-gray-400">
              Telefone:{" "}
              <span className="font-mono">
                {item.phone?.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
              </span>
            </span>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">
              {item.total_sent} mensagens enviadas
              {item.description && (
                <span className="text-gray-400 dark:text-gray-500">
                  {" "}
                  - {item.description}
                </span>
              )}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: SendingHistory) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(item.status)}`}
        >
          {getStatusIcon(item.status)}
          {getStatusLabel(item.status)}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Data/Hora",
      render: (item: SendingHistory) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(item.created_at).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  const stats = {
    total: history.length,
    individual: history.filter((h) => h.sending_type === "individual").length,
    bulk: history.filter((h) => h.sending_type === "bulk").length,
    success: history.filter((h) => h.status === "success").length,
    failed: history.filter((h) => h.status === "failed").length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Histórico
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Visualize o histórico de mensagens enviadas
            </p>
          </div>
          <Button variant="outline" onClick={loadHistory} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Individual
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.individual}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Em Massa</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.bulk}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Sucesso</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.success}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Falhas</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.failed}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-whatsapp-light text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("individual")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "individual"
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setFilter("bulk")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "bulk"
                ? "bg-purple-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Em Massa
          </button>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={paginatedHistory}
          keyExtractor={(item) => item.id as string}
          loading={loading}
          emptyMessage="Nenhum registro encontrado"
        />

        {/* Pagination */}
        {!loading && filteredHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Itens por pagina:
                </span>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setItemsPerPage(option)}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        itemsPerPage === option
                          ? "bg-whatsapp-light text-white"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page info */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {startIndex + 1}
                </span>{" "}
                a{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.min(endIndex, filteredHistory.length)}
                </span>{" "}
                de{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {filteredHistory.length}
                </span>{" "}
                registros
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                {/* First page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Primeira pagina"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous page */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Pagina anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 py-1 text-gray-400 dark:text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-whatsapp-light text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                {/* Next page */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Proxima pagina"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Ultima pagina"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
