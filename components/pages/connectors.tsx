"use client";

import { useState, useMemo } from "react";
import type { Connector } from "@/app/page";
import Pagination from "@/components/pagination";
import Modal from "@/components/ui/modal";
import ConnectorForm from "@/components/forms/connector-form";

interface ConnectorsProps {
  connectors: Connector[];
  onAddConnector: (connectorData: Connector) => Promise<Connector>;
  onUpdateConnector: (connector: Connector) => Promise<Connector>;
  onDeleteConnector: (yazakiPN: string) => Promise<void>;
}

export default function Connectors({
  connectors,
  onAddConnector,
  onUpdateConnector,
  onDeleteConnector,
}: ConnectorsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingConnector, setEditingConnector] = useState<Connector | null>(null);
  const itemsPerPage = 10;

  const suppliers = useMemo(() => {
    return [...new Set(connectors.map((c) => c.supplierName))].sort();
  }, [connectors]);

  const filteredConnectors = useMemo(() => {
    return connectors.filter((connector) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        connector.yazakiPN.toLowerCase().includes(q) ||
        connector.customerPN.toLowerCase().includes(q) ||
        connector.supplierPN.toLowerCase().includes(q);
      const matchesSupplier = !supplierFilter || connector.supplierName === supplierFilter;
      return matchesSearch && matchesSupplier;
    });
  }, [connectors, searchTerm, supplierFilter]);

  const paginatedConnectors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredConnectors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredConnectors, currentPage]);

  const totalPages = Math.ceil(filteredConnectors.length / itemsPerPage);

  const handleEdit = (connector: Connector) => {
    setEditingConnector(connector);
    setShowModal(true);
  };

  const handleDelete = async (connector: Connector) => {
    if (confirm("Are you sure you want to delete this connector?")) {
      await onDeleteConnector(connector.yazakiPN);
    }
  };

  const handleAddConnector = () => {
    setEditingConnector(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (connectorData: Connector) => {
    if (editingConnector) {
      // preserve id for update
      await onUpdateConnector({ ...editingConnector, ...connectorData, id: editingConnector.id });
    } else {
      await onAddConnector(connectorData);
    }
    setShowModal(false);
    setEditingConnector(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConnector(null);
  };

  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Connectors Management</h2>
        <button
          onClick={handleAddConnector}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Add Connector
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by part numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yazaki PN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer PN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier PN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedConnectors.map((connector) => (
                <tr key={connector.yazakiPN} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {connector.image_path ? (
                      <img
                        src={`${backendUrl}${connector.image_path}`}
                        alt={connector.yazakiPN}
                        className="h-10 w-10 rounded object-cover border"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {connector.yazakiPN}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{connector.customerPN}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{connector.supplierPN}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{connector.supplierName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {connector.price !== null && connector.price !== undefined
                      ? `$${connector.price.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(connector)}
                        className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(connector)}
                        className="text-red-600 hover:text-red-900 px-3 py-1 rounded border border-red-600 hover:bg-red-50 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredConnectors.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingConnector ? "Edit Connector" : "Add New Connector"}
      >
        <ConnectorForm
          connector={editingConnector || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
