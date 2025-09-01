"use client";

import type React from "react";
import { useState } from "react";
import type { Connector } from "@/app/page";

interface ConnectorFormProps {
  connector?: Connector;
  onSubmit: (connectorData: Connector) => Promise<void>;
  onCancel: () => void;
}

export default function ConnectorForm({ connector, onSubmit, onCancel }: ConnectorFormProps) {
  const [formData, setFormData] = useState({
    yazakiPN: connector?.yazakiPN || "",
    customerPN: connector?.customerPN || "",
    supplierPN: connector?.supplierPN || "",
    supplierName: connector?.supplierName || "",
    connectorName: connector?.connectorName || "", // optional
    price: connector?.price ?? null as number | null, // allow null
    drawing_2d_path: connector?.drawing_2d_path || "",
    model_3d_path: connector?.model_3d_path || "",
    image_path: connector?.image_path || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData: Connector = {
        id: connector?.id, // keep id on edit
        yazakiPN: formData.yazakiPN,
        customerPN: formData.customerPN,
        supplierPN: formData.supplierPN,
        supplierName: formData.supplierName,
        connectorName: formData.connectorName || null,
        price: formData.price === null || Number.isNaN(formData.price) ? null : Number(formData.price),
        drawing_2d_path: formData.drawing_2d_path || null,
        model_3d_path: formData.model_3d_path || null,
        image_path: formData.image_path || null,
      };
      await onSubmit(submitData);
      onCancel();
    } catch (error) {
      console.error("Error submitting connector:", error);
      alert("Error saving connector. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="yazakiPN" className="block text-sm font-medium text-gray-700 mb-1">
          Yazaki PN
        </label>
        <input
          type="text"
          id="yazakiPN"
          value={formData.yazakiPN}
          onChange={(e) => setFormData({ ...formData, yazakiPN: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={!!connector} // lock on edit
        />
      </div>

      <div>
        <label htmlFor="customerPN" className="block text-sm font-medium text-gray-700 mb-1">
          Customer PN
        </label>
        <input
          type="text"
          id="customerPN"
          value={formData.customerPN}
          onChange={(e) => setFormData({ ...formData, customerPN: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="supplierPN" className="block text-sm font-medium text-gray-700 mb-1">
          Supplier PN
        </label>
        <input
          type="text"
          id="supplierPN"
          value={formData.supplierPN}
          onChange={(e) => setFormData({ ...formData, supplierPN: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-1">
          Supplier Name
        </label>
        <input
          type="text"
          id="supplierName"
          value={formData.supplierName}
          onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="connectorName" className="block text-sm font-medium text-gray-700 mb-1">
          Connector Name (optional)
        </label>
        <input
          type="text"
          id="connectorName"
          value={formData.connectorName}
          onChange={(e) => setFormData({ ...formData, connectorName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., 6570B"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
          Price ($, optional)
        </label>
        <input
          type="number"
          id="price"
          step="0.01"
          min="0"
          value={formData.price ?? ""} // blank if null
          onChange={(e) => {
            const v = e.target.value;
            setFormData({ ...formData, price: v === "" ? null : Number.parseFloat(v) });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="drawing_2d_path" className="block text-sm font-medium text-gray-700 mb-1">
          2D Drawing Path (Optional)
        </label>
        <input
          type="text"
          id="drawing_2d_path"
          value={formData.drawing_2d_path}
          onChange={(e) => setFormData({ ...formData, drawing_2d_path: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="/files/drawings/YZ-XXX-2D.pdf"
        />
      </div>

      <div>
        <label htmlFor="model_3d_path" className="block text-sm font-medium text-gray-700 mb-1">
          3D Model Path (Optional)
        </label>
        <input
          type="text"
          id="model_3d_path"
          value={formData.model_3d_path}
          onChange={(e) => setFormData({ ...formData, model_3d_path: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="/files/models/YZ-XXX-3D.step"
        />
      </div>

      <div>
        <label htmlFor="image_path" className="block text-sm font-medium text-gray-700 mb-1">
          Image Path (Optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            id="image_path"
            value={formData.image_path}
            onChange={(e) => setFormData({ ...formData, image_path: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="/images/YZ-XXX.jpg"
          />
          {formData.image_path ? (
            <a
              href={`${backendUrl}${formData.image_path.startsWith("/") ? formData.image_path : `/${formData.image_path}`}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 underline"
            >
              Open
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : connector ? "Update Connector" : "Add Connector"}
        </button>
      </div>
    </form>
  );
}
