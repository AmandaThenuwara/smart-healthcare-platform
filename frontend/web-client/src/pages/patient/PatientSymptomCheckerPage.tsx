import { useEffect, useState, type FormEvent } from "react";
import PatientShell from "./PatientShell";
import { createSymptomCheck, getMySymptomChecks } from "../../api/aiSymptomApi";
import type { SymptomCheck } from "../../types/symptom";
import { 
  Stethoscope, 
  Send, 
  History, 
  RefreshCw, 
  AlertTriangle, 
  Calendar, 
  Activity, 
  User, 
  Clock, 
  MessageSquare,
  ShieldAlert,
  ClipboardList,
  CheckCircle2
} from "lucide-react";

export default function PatientSymptomCheckerPage() {
  const [symptomsInput, setSymptomsInput] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState<"" | "MILD" | "MODERATE" | "SEVERE">("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [history, setHistory] = useState<SymptomCheck[]>([]);
  const [latestResult, setLatestResult] = useState<SymptomCheck | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadHistory();
  }, []);

  async function loadHistory() {
    setIsLoadingHistory(true);
    setError("");

    try {
      const data = await getMySymptomChecks();
      setHistory(data);
      if (data.length > 0) {
        setLatestResult(data[0]);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to load symptom check history. Make sure your patient profile exists and the AI service is running.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    const symptoms = symptomsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (symptoms.length === 0) {
      setError("Enter at least one symptom.");
      setIsSubmitting(false);
      return;
    }

    try {
      const created = await createSymptomCheck({
        symptoms,
        age: age ? Number(age) : undefined,
        sex: sex || undefined,
        duration: duration || undefined,
        severity: severity || undefined,
        additionalNotes: additionalNotes || undefined,
      });

      setLatestResult(created);
      setMessage("AI symptom check completed successfully.");
      setSymptomsInput("");
      setAge("");
      setSex("");
      setDuration("");
      setSeverity("");
      setAdditionalNotes("");

      await loadHistory();
    } catch (error) {
      console.error(error);
      setError("Failed to run AI symptom check.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PatientShell
      title="AI Symptom Checker"
      subtitle="Describe symptoms to receive a cautious AI-generated triage summary, urgency level, and next-step recommendation."
    >
      <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50 mb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <Stethoscope size={20} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-800">Run Symptom Check</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Symptoms</label>
            <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
              <MessageSquare size={18} className="text-slate-400 mt-1" />
              <textarea
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                className="w-full min-h-[110px] bg-transparent outline-none text-[14px] text-slate-800 resize-y"
                placeholder="Example: fever, headache, sore throat"
                required
              />
            </div>
            <p className="text-[12px] text-slate-400 font-medium ml-1">Enter symptoms separated by commas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Age</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <User size={16} className="text-slate-400" />
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full py-3 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="25"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Sex</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Activity size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full py-3 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="Male / Female"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Duration</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Clock size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full py-3 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="2 days"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Severity</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <ShieldAlert size={16} className="text-slate-400" />
                <select
                  value={severity}
                  onChange={(e) =>
                    setSeverity(e.target.value as "" | "MILD" | "MODERATE" | "SEVERE")
                  }
                  className="w-full py-3 bg-transparent outline-none text-[14px] text-slate-800 appearance-none cursor-pointer"
                >
                  <option value="">Select severity</option>
                  <option value="MILD">MILD</option>
                  <option value="MODERATE">MODERATE</option>
                  <option value="SEVERE">SEVERE</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Additional Notes</label>
            <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
              <ClipboardList size={18} className="text-slate-400 mt-1" />
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full min-h-[90px] bg-transparent outline-none text-[14px] text-slate-800 resize-y"
                placeholder="Any extra details..."
              />
            </div>
          </div>

          <div className="mt-2">
            {error && <p className="text-rose-500 text-sm font-medium mb-4">{error}</p>}
            {message && <p className="text-emerald-500 text-sm font-medium mb-4">{message}</p>}
            
            <button type="submit" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2.5 disabled:opacity-50" disabled={isSubmitting}>
              <Send size={18} />
              <span>{isSubmitting ? "Analyzing..." : "Run AI Symptom Check"}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50 mb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <CheckCircle2 size={20} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-800">Latest Result</h2>
        </div>

        {!latestResult ? (
          <div className="py-12 flex flex-col items-center gap-4 text-center">
            <ShieldAlert size={40} className="text-slate-100" />
            <p className="text-slate-400 font-medium">No symptom check result available yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`p-6 rounded-[22px] border ${
              (latestResult.urgencyLevel === "HIGH" || latestResult.urgencyLevel === "EMERGENCY") 
                ? "bg-rose-50/50 border-rose-100" 
                : "bg-amber-50/50 border-amber-100"
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className={(latestResult.urgencyLevel === "HIGH" || latestResult.urgencyLevel === "EMERGENCY") ? "text-rose-500" : "text-amber-500"} />
                <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-wider">
                  Urgency: <span className={(latestResult.urgencyLevel === "HIGH" || latestResult.urgencyLevel === "EMERGENCY") ? "text-rose-600" : "text-amber-600"}>
                    {latestResult.urgencyLevel}
                  </span>
                </h3>
              </div>
              <p className="text-[14px] text-slate-700 leading-relaxed font-medium">{latestResult.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50/50 p-6 rounded-[22px] border border-slate-100">
                <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">Possible Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {latestResult.possibleConditions && latestResult.possibleConditions.length > 0 ? latestResult.possibleConditions.map((c, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[12px] font-bold text-slate-600">{c}</span>
                  )) : <span className="text-slate-400 text-sm italic font-medium">None suggested</span>}
                </div>
              </div>
              <div className="bg-slate-50/50 p-6 rounded-[22px] border border-slate-100">
                <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">Red Flags</h4>
                <div className="flex flex-wrap gap-2">
                  {latestResult.redFlags && latestResult.redFlags.length > 0 ? latestResult.redFlags.map((flag, i) => (
                    <span key={i} className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[12px] font-bold">{flag}</span>
                  )) : <span className="text-slate-400 text-sm italic font-medium">None highlighted</span>}
                </div>
              </div>
            </div>

            <div className="bg-slate-100/50 p-6 rounded-[22px] border border-slate-100">
              <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">Recommendation</h4>
              <p className="text-[14px] text-slate-700 font-bold leading-relaxed">{latestResult.recommendation}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-[15px] text-[11px] font-bold text-slate-400 leading-relaxed italic">
              {latestResult.disclaimer}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
              <History size={20} />
            </div>
            <h2 className="text-[17px] font-bold text-slate-800">Check History</h2>
          </div>
          <button onClick={() => void loadHistory()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-[12px] font-bold text-[13px] hover:bg-slate-200 transition-all">
            <RefreshCw size={16} className={isLoadingHistory ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <RefreshCw size={32} className="animate-spin text-slate-300" />
            <p className="text-slate-400 font-medium">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <History size={48} className="text-slate-100" />
            <p className="text-slate-400 font-medium">No symptom checks found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {history.map((item) => (
              <div key={item.checkId} className="p-6 bg-slate-50/50 rounded-[22px] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-white transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {item.submittedSymptoms.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500 uppercase tracking-wider">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                    <Calendar size={14} className="text-slate-300" />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    item.urgencyLevel === "HIGH" || item.urgencyLevel === "EMERGENCY" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                  }`}>
                    {item.urgencyLevel}
                  </span>
                  <p className="text-[13.5px] font-bold text-slate-700 truncate">{item.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientShell>
  );
}
