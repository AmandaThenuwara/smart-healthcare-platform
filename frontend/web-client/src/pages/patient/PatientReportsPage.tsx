import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PatientShell from "./PatientShell";
import {
  createMedicalReport,
  getMedicalReportsByPatient,
  getStoredPatientProfile,
} from "../../api/patientApi";
import type { MedicalReport } from "../../types/patient";
import { 
  FileText, 
  Plus, 
  RefreshCw, 
  File, 
  Calendar, 
  Link as LinkIcon, 
  Tag, 
  AlertCircle,
  History,
  ExternalLink
} from "lucide-react";

function sortReports(reports: MedicalReport[]) {
  return [...reports].sort((a, b) => {
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });
}

export default function PatientReportsPage() {
  const [patientId, setPatientId] = useState("");
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    fileName: "",
    fileUrl: "",
    reportType: "",
  });

  useEffect(() => {
    const storedPatient = getStoredPatientProfile();

    if (!storedPatient) {
      setIsLoading(false);
      return;
    }

    setPatientId(storedPatient.patientId);
    void loadReports(storedPatient.patientId);
  }, []);

  async function loadReports(currentPatientId: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getMedicalReportsByPatient(currentPatientId);
      setReports(sortReports(data));
    } catch (error) {
      console.error(error);
      setError("Failed to load medical reports");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!patientId) {
      setError("Create the patient profile first.");
      return;
    }

    try {
      await createMedicalReport({
        patientId,
        title: form.title.trim(),
        fileName: form.fileName.trim(),
        fileUrl: form.fileUrl.trim(),
        reportType: form.reportType.trim(),
      });

      setMessage("Medical report metadata created successfully.");
      setForm({
        title: "",
        fileName: "",
        fileUrl: "",
        reportType: "",
      });

      await loadReports(patientId);
    } catch (error) {
      console.error(error);
      setError("Failed to create medical report metadata");
    }
  }

  return (
    <PatientShell
      title="Medical Reports"
      subtitle="View and manage your health records and diagnostic reports."
    >
      {!patientId ? (
        <div className="bg-white rounded-[24px] p-12 shadow-soft flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">Patient Profile Needed</h2>
            <p className="text-slate-500 max-w-md">
              Please create the patient profile first so the frontend has a saved
              patientId to use.
            </p>
          </div>
          <Link to="/patient/profile" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg hover:bg-slate-800 transition-all">
            Go to Patient Profile
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50 mb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Plus size={20} />
              </div>
              <h2 className="text-[17px] font-bold text-slate-800">Add Report Metadata</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Title</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <FileText size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                    placeholder="Blood Test Report"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">File Name</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <File size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={form.fileName}
                    onChange={(e) =>
                      setForm({ ...form, fileName: e.target.value })
                    }
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                    placeholder="blood-test.pdf"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">File URL</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <LinkIcon size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={form.fileUrl}
                    onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                    placeholder="/uploads/..."
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Report Type</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <Tag size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={form.reportType}
                    onChange={(e) =>
                      setForm({ ...form, reportType: e.target.value })
                    }
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                    placeholder="Lab Report"
                    required
                  />
                </div>
              </div>

              <div className="col-span-full mt-2">
                {error && <p className="text-rose-500 text-sm font-medium mb-4">{error}</p>}
                {message && <p className="text-emerald-500 text-sm font-medium mb-4">{message}</p>}
                
                <button type="submit" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2">
                  <Plus size={18} />
                  <span>Add Report Metadata</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                  <History size={20} />
                </div>
                <h2 className="text-[17px] font-bold text-slate-800">Existing Reports</h2>
              </div>
              <button 
                onClick={() => void loadReports(patientId)} 
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-[12px] font-bold text-[13px] hover:bg-slate-200 transition-all"
                disabled={isLoading}
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <RefreshCw size={32} className="animate-spin text-slate-300" />
                <p className="text-slate-400 font-medium">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 text-center">
                <FileText size={48} className="text-slate-100" />
                <p className="text-slate-400 font-medium">No medical reports found yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => (
                  <div key={report.reportId} className="flex justify-between items-center p-6 bg-slate-50/50 rounded-[22px] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-white transition-all duration-300 group">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-[15px] font-bold text-slate-800">{report.title}</h3>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 overflow-hidden">
                          <Tag size={14} className="text-slate-300" />
                          <span className="truncate">{report.reportType}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                          <Calendar size={14} className="text-slate-300" />
                          <span>{new Date(report.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white rounded-[10px] text-[11px] font-bold text-slate-500 border border-slate-100">
                        <File size={14} className="text-slate-300" />
                        <span className="truncate max-w-[120px]">{report.fileName}</span>
                      </div>
                      <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#0f172a] text-white px-5 py-2.5 rounded-[12px] font-bold text-[13px] hover:bg-slate-800 transition-all">
                        <ExternalLink size={14} />
                        <span>View</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PatientShell>
  );
}
