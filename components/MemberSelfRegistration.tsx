
import React, { useState } from 'react';
import { User, Smartphone, Cake, Fingerprint, ArrowRight, CheckCircle2, Heart, X } from 'lucide-react';
import { CellMember } from '../types';

interface MemberSelfRegistrationProps {
  onComplete: (m: CellMember) => void;
  onCancel: () => void;
}

const MemberSelfRegistration: React.FC<MemberSelfRegistrationProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
      chineseName: '',
      englishName: '',
      phoneNumber: '',
      birthday: '',
      memberId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chineseName || !formData.phoneNumber) return;
    
    setStep('success');
    
    // Simulate API delay
    setTimeout(() => {
        const newMember: CellMember = {
            id: `reg-${Date.now()}`,
            chineseName: formData.chineseName,
            englishName: formData.englishName,
            phoneNumber: formData.phoneNumber,
            birthday: formData.birthday,
            memberId: formData.memberId,
            status: 'active',
            groupIds: [], // Leader will assign later or it can be pre-filled via QR params
            joinedDate: new Date().toISOString().split('T')[0]
        };
        onComplete(newMember);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
          <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E85C10] rounded-2xl shadow-xl shadow-orange-100 mb-4">
                  <Heart className="w-8 h-8 text-white fill-current" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Join Cell Group</h1>
              <p className="text-slate-500 font-bold text-sm mt-1">Please fill in your details to stay connected</p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 border border-slate-100 relative overflow-hidden">
              <button onClick={onCancel} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors"><X className="w-5 h-5" /></button>

              {step === 'form' ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-4">
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chinese Name (中文姓名) *</label>
                              <div className="relative group">
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                                  <input 
                                    required
                                    type="text" 
                                    placeholder="陳大文" 
                                    value={formData.chineseName}
                                    onChange={(e) => setFormData({...formData, chineseName: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                  />
                              </div>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">English Name (英文姓名)</label>
                              <input 
                                type="text" 
                                placeholder="David Chan" 
                                value={formData.englishName}
                                onChange={(e) => setFormData({...formData, englishName: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                              />
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number (電話) *</label>
                              <div className="relative group">
                                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                                  <input 
                                    required
                                    type="tel" 
                                    placeholder="9123 4567" 
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                  />
                              </div>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birthday (生日日期)</label>
                              <div className="relative group">
                                  <Cake className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                                  <input 
                                    type="date" 
                                    value={formData.birthday}
                                    onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                  />
                              </div>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member ID (教會編號)</label>
                              <div className="relative group">
                                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                                  <input 
                                    type="text" 
                                    placeholder="M12345" 
                                    value={formData.memberId}
                                    onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                  />
                              </div>
                          </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-5 bg-[#E85C10] text-white rounded-3xl font-black text-lg shadow-xl shadow-orange-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:bg-orange-600"
                      >
                          Submit Registration
                          <ArrowRight className="w-6 h-6" />
                      </button>
                  </form>
              ) : (
                  <div className="py-10 text-center animate-in zoom-in-95 duration-500">
                      <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Registration Sent!</h2>
                      <p className="text-slate-500 font-bold mb-10 leading-relaxed px-4">
                          Welcome to the family. Your cell leader will verify your details and connect with you shortly.
                      </p>
                      <div className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-400 text-sm">
                          "They broke bread in their homes and ate together with glad and sincere hearts."
                      </div>
                  </div>
              )}
          </div>
          
          <p className="mt-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Powered by Shepherd View &bull; 611 BIC</p>
      </div>
    </div>
  );
};

export default MemberSelfRegistration;
