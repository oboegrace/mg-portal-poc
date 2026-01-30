
import React, { useState, useRef, useEffect } from 'react';
import { Save, Camera, Mail, Phone, User, Heart, Info, ArrowLeft, Check, ChevronDown, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { CellLeader } from '../types';
import { GENDERS, PROFILE_AGE_RANGES, MARRIAGE_STATUSES, SPECIAL_CONDITIONS, YES_NO } from './constants';

// --- Sub-components moved outside to prevent focus loss during re-renders ---

const ReadOnlyField = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
  <div className="space-y-1.5 opacity-90">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </label>
    <div className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed select-none flex items-center gap-2 group transition-all">
      {value || '--'}
      <span className="text-[8px] bg-white text-slate-400 px-1.5 py-0.5 rounded ml-auto border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">LOCKED</span>
    </div>
  </div>
);

const EditableField = ({ label, value, field, type = 'text', placeholder, icon: Icon, options, onChange }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </label>
    {options ? (
      <div className="relative">
        <select 
          value={value || ''} 
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full appearance-none p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all text-sm cursor-pointer hover:border-slate-300"
        >
          <option value="">Select Option</option>
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    ) : (
      <input 
        type={type} 
        value={value || ''} 
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all text-sm hover:border-slate-300" 
      />
    )}
  </div>
);

const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
  <h3 className="flex items-center gap-2 text-[11px] font-black text-blue-600 uppercase tracking-[0.25em] mb-5 mt-10 first:mt-0">
    <Icon className="w-4 h-4" />
    {title}
  </h3>
);

interface ProfileSettingsProps {
  user: CellLeader;
  onSave: (updatedUser: CellLeader) => void;
  onCancel: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CellLeader>({ ...user });
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatarUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password States
  const [showPasswords, setShowPasswords] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync state if user prop changes externally
  useEffect(() => {
    setFormData({ ...user });
    setPreviewUrl(user.avatarUrl || null);
  }, [user]);

  const handleInputChange = (field: keyof CellLeader, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      handleInputChange('avatarUrl', url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    // If attempting to change password
    if (newPassword || confirmPassword || currentPasswordInput) {
      if (currentPasswordInput !== user.password) {
        setPasswordError("Current password is incorrect.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError("New passwords do not match.");
        return;
      }
      if (newPassword.length < 4) {
        setPasswordError("New password must be at least 4 characters.");
        return;
      }
      formData.password = newPassword;
    }

    setIsSaving(true);
    
    // Simulate API delay for professional feel
    setTimeout(() => {
      onSave(formData);
      setIsSaving(false);
      setShowSuccess(true);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden animate-in slide-in-from-right duration-500">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSaving}
            className="p-2 -ml-2 hover:bg-slate-50 rounded-full text-slate-600 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Profile Settings</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Update your personal and ministry profile</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {showSuccess && (
             <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in slide-in-from-right-4">
               <Check className="w-4 h-4" /> Changes saved
             </span>
          )}
          <button 
            type="submit" 
            form="profile-settings-form"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 stroke-[3]" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 sm:p-10 no-scrollbar">
        <form id="profile-settings-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-10 pb-24">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
                <div 
                    className="relative group cursor-pointer" 
                    onClick={() => !isSaving && fileInputRef.current?.click()}
                >
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-200 flex items-center justify-center transition-all group-hover:brightness-90 group-hover:scale-[1.02]">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-16 h-16 text-slate-400" />
                        )}
                        {isSaving && (
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white text-blue-600 p-2.5 rounded-2xl border border-slate-100 shadow-xl transition-transform group-hover:scale-110">
                        <Camera className="w-5 h-5" />
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handlePhotoUpload} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>
                <h2 className="mt-5 text-2xl font-black text-slate-900 tracking-tight">{user.chineseName || user.firstName}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{user.mgCode}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">{user.identity || 'Leader'}</span>
                </div>
            </div>

            {/* Personal Info */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
                <SectionHeader title="Personal Data" icon={User} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <ReadOnlyField label="Chinese Name (System)" value={formData.chineseName || ''} />
                    <ReadOnlyField label="MG Code (System)" value={formData.mgCode} />
                    
                    <EditableField label="Surname" field="lastName" value={formData.lastName} placeholder="e.g. Chan" onChange={handleInputChange} />
                    <EditableField label="Given Name" field="firstName" value={formData.firstName} placeholder="e.g. Jason" onChange={handleInputChange} />
                    
                    <EditableField label="Nick Name" field="nickName" value={formData.nickName} placeholder="Common name" onChange={handleInputChange} />
                    <EditableField label="Gender" field="gender" value={formData.gender} options={GENDERS} onChange={handleInputChange} />
                    
                    <EditableField label="Age Range" field="ageRange" value={formData.ageRange} options={PROFILE_AGE_RANGES} onChange={handleInputChange} />
                    <EditableField label="Occupation" field="occupation" value={formData.occupation} placeholder="Your profession" onChange={handleInputChange} />
                    
                    <EditableField label="Marriage Status" field="marriageStatus" value={formData.marriageStatus} options={MARRIAGE_STATUSES} onChange={handleInputChange} />
                    <EditableField label="Member ID" field="memberId" value={formData.memberId} placeholder="Church member ID" onChange={handleInputChange} />
                </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
                <SectionHeader title="Contact Info" icon={Mail} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            Mobile Number
                        </label>
                        <div className="flex gap-2">
                            <div className="w-20 p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-400 text-sm flex items-center justify-center">
                                +852
                            </div>
                            <input 
                                type="tel" 
                                value={formData.phoneNumber || ''} 
                                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                className="flex-1 p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all text-sm hover:border-slate-300" 
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email Address</span>
                            <span className="flex items-center gap-1 text-[8px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-black border border-emerald-100">
                                <Check className="w-2 h-2" /> VERIFIED
                            </span>
                         </label>
                         <input 
                            type="email" 
                            value={formData.email || ''} 
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all text-sm hover:border-slate-300" 
                        />
                    </div>
                </div>
            </div>

            {/* Security Info */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
                <SectionHeader title="Security & Password" icon={Lock} />
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Password</label>
                            <div className="relative">
                                <input 
                                    type={showPasswords ? 'text' : 'password'} 
                                    value={currentPasswordInput} 
                                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                                    placeholder="Verify current password to change"
                                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all text-sm hover:border-slate-300" 
                                />
                                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Password</label>
                            <input 
                                type={showPasswords ? 'text' : 'password'} 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min 4 characters"
                                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all text-sm hover:border-slate-300" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm New Password</label>
                            <input 
                                type={showPasswords ? 'text' : 'password'} 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat new password"
                                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all text-sm hover:border-slate-300" 
                            />
                        </div>
                    </div>
                    {passwordError && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[11px] font-bold animate-in fade-in">
                            Error: {passwordError}
                        </div>
                    )}
                </div>
            </div>

            {/* Ministry Info */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
                <SectionHeader title="Ministry Profile" icon={Heart} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                    <ReadOnlyField label="Parent Cell Leader" value={formData.parentLeaderName || ''} />
                    <ReadOnlyField label="Ordination Date (按立日期)" value={formData.ordinationDate || ''} />
                    <ReadOnlyField label="Identity (身份)" value={formData.identity || ''} />
                    <EditableField label="Recommend Team Members?" field="recommendTeamMembers" value={formData.recommendTeamMembers} options={YES_NO} onChange={handleInputChange} />
                    <EditableField label="Pastor Emotional Issues?" field="pastorEmotionalIssues" value={formData.pastorEmotionalIssues} options={YES_NO} onChange={handleInputChange} />
                    <EditableField label="Special Condition Members" field="specialConditionMember" value={formData.specialConditionMember} options={SPECIAL_CONDITIONS} onChange={handleInputChange} />
                </div>
                <div className="p-5 bg-blue-50/40 rounded-3xl border border-blue-100 flex gap-4 transition-all hover:bg-blue-50/60">
                    <div className="p-3 bg-white text-blue-600 rounded-2xl h-fit shadow-sm border border-blue-50">
                        <Info className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-black text-blue-900 text-[13px]">Pastoral Recommendation Note</h4>
                        <p className="text-[11px] text-blue-700/80 font-bold leading-relaxed mt-1 tracking-tight">
                            Your status helps the administrative team assign new members effectively. 
                            If you're currently overwhelmed, please update these settings accordingly.
                        </p>
                    </div>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
