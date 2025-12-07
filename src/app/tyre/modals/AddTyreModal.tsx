import { useState } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTyreAdded: () => void;
}

export function AddTyreModal({ isOpen, onClose, onTyreAdded }: Props) {
  const [formData, setFormData] = useState({
    tyreNumber: "", brand: "", model: "", size: "",
    purchasePrice: "", vendorName: "", initialTreadDepth: 16
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("ownerToken");
      const parsedToken = token ? JSON.parse(token) : null;
      
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/tyre`, 
        { 
            ...formData,
            purchaseDate: new Date().toISOString(),
            decryptedPayload: { id: "TEMP" } // Middleware should handle this
        },
        { headers: { authorization: parsedToken?.accessToken } }
      );
      
      onTyreAdded();
      setFormData({ tyreNumber: "", brand: "", model: "", size: "", purchasePrice: "", vendorName: "", initialTreadDepth: 16 });
    } catch (error) {
      alert("Failed to add tyre");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Tyre</h2>
          <button onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <input placeholder="Tyre Number / ID" className="border p-2 rounded" required 
                value={formData.tyreNumber} onChange={e => setFormData({...formData, tyreNumber: e.target.value})} />
             <input placeholder="Size (e.g., 295/80 R22.5)" className="border p-2 rounded" required 
                value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <input placeholder="Brand" className="border p-2 rounded" required 
                value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
             <input placeholder="Model" className="border p-2 rounded" required 
                value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <input type="number" placeholder="Price" className="border p-2 rounded" required 
                value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} />
             <input type="number" placeholder="Tread Depth (mm)" className="border p-2 rounded" required 
                value={formData.initialTreadDepth} onChange={e => setFormData({...formData, initialTreadDepth: Number(e.target.value)})} />
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            {loading ? "Adding..." : "Add to Inventory"}
          </button>
        </form>
      </div>
    </div>
  );
}