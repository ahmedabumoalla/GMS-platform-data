'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { 
  FileText, Briefcase, Plus, CheckCircle, XCircle, 
  Clock, DollarSign, X, Building, Calendar, MapPin, 
  UploadCloud, Users, Percent, ShieldCheck, Layers 
} from 'lucide-react';

// Dynamic import for the Map component
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

// Types
type Contract = {
  id: number;
  project_name: string;
  client_name: string;
  value: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  contract_type: string; // Direct or Subcontract
};

type Manager = {
    id: number;
    full_name: string;
};

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(1); 

  // Form Data
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    value: '',
    start_date: '',
    end_date: '',
    contract_type: 'Direct', 
    subcontractor_name: '',
    subcontractor_share: '',
    company_margin: '',
    estimated_technicians: '',
    manager_ids: [] as string[], 
    location_lat: 24.7136, 
    location_lng: 46.6753,
    end_lat: 24.7236,
    end_lng: 46.6853,
    deliverables: '',
    files: [] as File[] 
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchContracts();
    fetchManagers();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    const { data } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
    if (data) setContracts(data as Contract[]);
    setLoading(false);
  };

  const fetchManagers = async () => {
    const { data } = await supabase.from('users').select('id, full_name').eq('role', 'manager');
    if (data) setManagers(data);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_name || !formData.value) return;

    const payload = {
        project_name: formData.project_name,
        client_name: formData.client_name,
        value: parseFloat(formData.value),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        contract_type: formData.contract_type,
        subcontractor_name: formData.contract_type === 'Subcontract' ? formData.subcontractor_name : null,
        subcontractor_share: formData.contract_type === 'Subcontract' ? parseFloat(formData.subcontractor_share) : 0,
        company_margin: parseFloat(formData.company_margin) || 0,
        estimated_technicians: parseInt(formData.estimated_technicians) || 0,
        location_lat: formData.location_lat,
        location_lng: formData.location_lng,
        end_lat: formData.end_lat,
        end_lng: formData.end_lng,
        deliverables: formData.deliverables,
        manager_ids: formData.manager_ids.map(id => parseInt(id)), 
        status: 'Pending'
    };

    const { error } = await supabase.from('contracts').insert(payload);

    if (!error) {
        setIsModalOpen(false);
        fetchContracts();
        alert('Contract details saved successfully! ✅');
    } else {
        console.error(error);
        alert('An error occurred while saving. Please check the data.');
    }
  };

  const handleManagerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const options = Array.from(e.target.selectedOptions, option => option.value);
     setFormData({ ...formData, manager_ids: options });
  };

  return (
    <div className="space-y-8 font-sans" dir="ltr">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="text-blue-600" /> Contracts & Projects Management
          </h2>
          <p className="text-slate-500 mt-1">Government and Private Contracts System (ERP Module).</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-200 transition"
        >
            <Plus size={18} /> Create New Contract
        </button>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                    <th className="p-5">Project</th>
                    <th className="p-5">Client</th>
                    <th className="p-5">Value</th>
                    <th className="p-5">Type</th>
                    <th className="p-5">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {contracts.map(contract => (
                    <tr key={contract.id} onClick={() => router.push(`/admin/contracts/${contract.id}`)} className="cursor-pointer hover:bg-slate-50">
                        <td className="p-5 font-bold">{contract.project_name}</td>
                        <td className="p-5 text-sm">{contract.client_name}</td>
                        <td className="p-5 font-bold text-blue-600">{contract.value.toLocaleString()} SAR</td>
                        <td className="p-5"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{contract.contract_type === 'Subcontract' ? 'Sub' : 'Direct'}</span></td>
                        <td className="p-5 text-sm">{contract.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Super Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">Register Project Contract</h3>
                        <p className="text-xs text-slate-500">Please fill in all administrative, financial, and technical details accurately.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-full border border-slate-200"><X size={20}/></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* Tabs Navigation */}
                    <div className="flex bg-white border-b border-slate-100 px-6 pt-4 gap-6 text-sm font-bold text-slate-500">
                        <button type="button" onClick={() => setActiveTab(1)} className={`pb-3 border-b-2 transition ${activeTab === 1 ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'}`}>1. Basic Info</button>
                        <button type="button" onClick={() => setActiveTab(2)} className={`pb-3 border-b-2 transition ${activeTab === 2 ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'}`}>2. Financials</button>
                        <button type="button" onClick={() => setActiveTab(3)} className={`pb-3 border-b-2 transition ${activeTab === 3 ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'}`}>3. Scope & Resources</button>
                        <button type="button" onClick={() => setActiveTab(4)} className={`pb-3 border-b-2 transition ${activeTab === 4 ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'}`}>4. Attachments</button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                        
                        {/* Tab 1: Basic Info */}
                        {activeTab === 1 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Project / Contract Name</label>
                                        <input type="text" className="input-field" placeholder="e.g., Lighting Maintenance Project..." 
                                            value={formData.project_name} onChange={e => setFormData({...formData, project_name: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Owning Entity (Client)</label>
                                        <input type="text" className="input-field" placeholder="e.g., Riyadh Municipality" 
                                            value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Contract Start Date</label>
                                        <input type="date" className="input-field" 
                                            value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Expected End Date</label>
                                        <input type="date" className="input-field" 
                                            value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Responsible Project Managers</label>
                                        <select multiple className="input-field h-24" onChange={handleManagerSelect}>
                                            {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl to select multiple managers</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Financials */}
                        {activeTab === 2 && (
                            <div className="space-y-6">
                                <div className="bg-white p-5 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><DollarSign size={16}/> Value Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label-text">Total Contract Value (SAR)</label>
                                            <input type="number" className="input-field text-lg font-bold" placeholder="0.00" 
                                                value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} required/>
                                        </div>
                                        <div>
                                            <label className="label-text">Expected Company Margin (%)</label>
                                            <input type="number" className="input-field" placeholder="e.g., 15%" 
                                                value={formData.company_margin} onChange={e => setFormData({...formData, company_margin: e.target.value})}/>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><ShieldCheck size={16}/> Contract Type</h4>
                                    <div className="flex gap-4 mb-4">
                                        <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center gap-2 ${formData.contract_type === 'Direct' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200'}`}>
                                            <input type="radio" name="ctype" value="Direct" checked={formData.contract_type === 'Direct'} onChange={() => setFormData({...formData, contract_type: 'Direct'})} />
                                            <span className="font-bold text-sm">Direct Contract</span>
                                        </label>
                                        <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center gap-2 ${formData.contract_type === 'Subcontract' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'border-slate-200'}`}>
                                            <input type="radio" name="ctype" value="Subcontract" checked={formData.contract_type === 'Subcontract'} onChange={() => setFormData({...formData, contract_type: 'Subcontract'})} />
                                            <span className="font-bold text-sm">Subcontract (Third Party)</span>
                                        </label>
                                    </div>

                                    {formData.contract_type === 'Subcontract' && (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                            <div>
                                                <label className="label-text">Subcontractor Name</label>
                                                <input type="text" className="input-field" placeholder="Company Name..." 
                                                    value={formData.subcontractor_name} onChange={e => setFormData({...formData, subcontractor_name: e.target.value})}/>
                                            </div>
                                            <div>
                                                <label className="label-text">Subcontractor Share (%)</label>
                                                <input type="number" className="input-field" placeholder="%" 
                                                    value={formData.subcontractor_share} onChange={e => setFormData({...formData, subcontractor_share: e.target.value})}/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Scope & Resources */}
                        {activeTab === 3 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label-text mb-2 block">Expected Deliverables</label>
                                        <textarea className="input-field h-32 resize-none" placeholder="- Deliver 50 units..." 
                                            value={formData.deliverables} onChange={e => setFormData({...formData, deliverables: e.target.value})}></textarea>
                                    </div>
                                    <div>
                                        <label className="label-text mb-2 block">Estimated Technicians Required</label>
                                        <input type="number" className="input-field" placeholder="Number of people..." 
                                            value={formData.estimated_technicians} onChange={e => setFormData({...formData, estimated_technicians: e.target.value})}/>
                                        <p className="text-xs text-slate-400 mt-2">This figure will be used for resource planning.</p>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="label-text flex items-center gap-2">
                                            <MapPin size={16} className="text-blue-600"/> Define Project Range (From - To)
                                        </label>
                                        <div className="text-[10px] text-slate-400">
                                            * Drag Green (Start) and Red (End) pins
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-100 rounded-xl overflow-hidden h-[400px] relative border border-slate-300 z-0">
                                        <LocationPicker 
                                            startPos={{ lat: formData.location_lat, lng: formData.location_lng }}
                                            endPos={{ lat: formData.end_lat, lng: formData.end_lng }}
                                            onStartChange={(lat, lng) => setFormData({...formData, location_lat: lat, location_lng: lng})}
                                            onEndChange={(lat, lng) => setFormData({...formData, end_lat: lat, end_lng: lng})}
                                        />
                                    </div>
                                    
                                    <div className="flex gap-6 mt-3 text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
                                            Start: {formData.location_lat.toFixed(4)}, {formData.location_lng.toFixed(4)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500 block"></span>
                                            End: {formData.end_lat.toFixed(4)}, {formData.end_lng.toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                         {/* Tab 4: Attachments */}
                         {activeTab === 4 && (
                            <div className="text-center py-10 space-y-4">
                                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                                    <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
                                    <h4 className="font-bold text-slate-700">Click to upload Contract PDF</h4>
                                    <p className="text-sm text-slate-400">Or drag files here (Max 20MB)</p>
                                    <input type="file" className="hidden" />
                                </div>
                                <div className="text-left">
                                    <h5 className="font-bold text-sm text-slate-700 mb-2">Additional Files:</h5>
                                    <div className="flex gap-2">
                                        <button type="button" className="text-xs bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200">+ Site Photos</button>
                                        <button type="button" className="text-xs bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200">+ BOQ (Excel)</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Controls */}
                    <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
                        <div className="text-xs text-slate-400">
                            * All marked fields are required to complete the registration.
                        </div>
                        <div className="flex gap-3">
                            {activeTab > 1 && (
                                <button type="button" onClick={() => setActiveTab(activeTab - 1)} className="px-6 py-2.5 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50">Previous</button>
                            )}
                            
                            {activeTab < 4 ? (
                                <button type="button" onClick={() => setActiveTab(activeTab + 1)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">Next</button>
                            ) : (
                                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">Save Final Contract</button>
                            )}
                        </div>
                    </div>

                </form>
            </div>
        </div>
      )}

      <style jsx>{`
        .input-field {
            @apply w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition text-sm text-slate-800;
        }
        .label-text {
            @apply block text-xs font-bold text-slate-500 mb-2;
        }
      `}</style>
    </div>
  );
}