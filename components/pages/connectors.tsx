"use client";
import { useState, useMemo, useEffect } from "react";
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
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
  
  const itemsPerPage = 10;
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");

  // Helper function to generate correct media URLs
  const getMediaUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendUrl}/media${cleanPath}`;
  };

  // Function to fetch image as blob and create object URL (for ngrok)
  const fetchImageAsBlob = async (imageUrl: string): Promise<string | null> => {
    try {
      const headers: HeadersInit = {};
      if (imageUrl.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      const response = await fetch(imageUrl, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to fetch image as blob:', error);
      return null;
    }
  };

  // Custom Image component that handles ngrok
  const ConnectorImage = ({ connector }: { connector: Connector }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadImage = async () => {
        if (!connector.image_path) {
          setLoading(false);
          return;
        }

        const imageUrl = getMediaUrl(connector.image_path);
        if (!imageUrl) {
          setLoading(false);
          return;
        }

        // Check cache first
        if (imageCache.has(imageUrl)) {
          setImageSrc(imageCache.get(imageUrl)!);
          setLoading(false);
          return;
        }

        try {
          // For ngrok URLs, fetch as blob first
          if (imageUrl.includes('ngrok')) {
            const blobUrl = await fetchImageAsBlob(imageUrl);
            if (blobUrl) {
              setImageSrc(blobUrl);
              setImageCache(prev => new Map(prev.set(imageUrl, blobUrl)));
            } else {
              setImageError(true);
            }
          } else {
            // For non-ngrok URLs, use direct URL
            setImageSrc(imageUrl);
          }
        } catch (error) {
          console.error('Error loading image:', error);
          setImageError(true);
        } finally {
          setLoading(false);
        }
      };

      loadImage();
    }, [connector.image_path, connector.yazakiPN]);

    if (loading) {
      return (
        <div className="h-10 w-10 rounded border bg-gray-100 flex items-center justify-center text-gray-400 text-xs animate-pulse">
          ...
        </div>
      );
    }

    if (imageError || !imageSrc) {
      return (
        <div className="h-10 w-10 rounded border bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
          No Image
        </div>
      );
    }

    return (
      <img
        src={imageSrc}
        alt={connector.yazakiPN}
        className="h-10 w-10 rounded object-cover border"
        onError={() => {
          console.error('Image failed to load:', imageSrc);
          setImageError(true);
        }}
      />
    );
  };

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

  const handleFormSubmit = async (
    connectorData: Connector,
    files?: {
      image?: File;
      drawing2d?: File;
      model3d?: File;
    }
  ) => {
    try {
      let updatedConnectorData: Connector = { ...connectorData };

      const toRenderablePath = (value: string | null | undefined): string | null => {
        if (!value) return null;
        const str = String(value);
        if (/^https?:\/\//i.test(str)) return str; // already absolute URL
        return str.startsWith('/') ? str : `/${str}`;
      };

      const stripMediaPrefix = (value: string | null | undefined): string | null => {
        if (!value) return null;
        // Remove a leading /media/ if present, keep a single leading slash
        return (`/${String(value).replace(/^\/?media\//i, '')}`).replace(/\/+/g, '/');
      };

      // Upload files first (if any), then merge returned paths into connector payload
      const hasAnyFile = Boolean(files && (files.image || files.drawing2d || files.model3d));
      
      if (hasAnyFile) {
        const uploadFormData = new FormData();
        
        // Base filename based on Yazaki PN so backend can name consistently
        uploadFormData.append('base_filename', connectorData.yazakiPN);
        
        // Subdirectory hints (adjust to your backend logic)
        uploadFormData.append('subdir1', 'images');
        uploadFormData.append('subdir2', '2d_drawing_files');
        uploadFormData.append('subdir3', '3d_drawing_files');

        // Files
        if (files?.image) uploadFormData.append('file1', files.image);
        if (files?.drawing2d) uploadFormData.append('file2', files.drawing2d);
        if (files?.model3d) uploadFormData.append('file3', files.model3d);

        const uploadUrl = `${backendUrl}/upload`;
        const headers: HeadersInit = {};
        if (uploadUrl.includes('ngrok')) headers['ngrok-skip-browser-warning'] = 'true';

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: uploadFormData,
          headers,
        });

        if (!uploadResponse.ok) {
          const errText = await uploadResponse.text().catch(() => '');
          throw new Error(`Failed to upload files: ${uploadResponse.status} ${uploadResponse.statusText} - ${errText}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log('[connectors] upload result:', uploadResult);

        // Adapt to backend response shape: { files: [{ file_key, full_url, file_path, ... }, ...] }
        const resultFiles: Array<any> = Array.isArray(uploadResult?.files) ? uploadResult.files : [];
        
        const byKey = (key: string) => resultFiles.find((f) => f?.file_key === key);
        const file1 = byKey('file1');
        const file2 = byKey('file2');
        const file3 = byKey('file3');

        if (files?.image && (file1?.full_url || file1?.file_path)) {
          const p = file1.full_url || file1.file_path;
          updatedConnectorData.image_path = toRenderablePath(stripMediaPrefix(p));
        }
        if (files?.drawing2d && (file2?.full_url || file2?.file_path)) {
          const p = file2.full_url || file2.file_path;
          updatedConnectorData.drawing_2d_path = toRenderablePath(stripMediaPrefix(p));
        }
        if (files?.model3d && (file3?.full_url || file3?.file_path)) {
          const p = file3.full_url || file3.file_path;
          updatedConnectorData.model_3d_path = toRenderablePath(stripMediaPrefix(p));
        }
      }

      // Save/update connector with the merged file paths
      if (editingConnector) {
        await onUpdateConnector({ ...editingConnector, ...updatedConnectorData, id: editingConnector.id });
      } else {
        await onAddConnector(updatedConnectorData);
      }

      setShowModal(false);
      setEditingConnector(null);
    } catch (error) {
      console.error('Error saving connector:', error);
      alert('Error saving connector. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConnector(null);
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      imageCache.forEach((blobUrl) => {
        if (blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl);
        }
      });
    };
  }, []);

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
                <th className="px-6 py-3 text-left text-xs font-medium text-glue-500 uppercase tracking-wider">
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
                    <ConnectorImage connector={connector} />
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