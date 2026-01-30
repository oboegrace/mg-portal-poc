
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Check, ChevronDown, Info, Trash2, AlertTriangle, X } from 'lucide-react';
import { CellGroup, CellLeader, ZoneCode, GroupCategory, DayOfWeek, TargetAudience, GroupFrequency, MemberRange } from '../types';
import { 
    ZONES, DAYS, GROUP_CATEGORY_LABELS,
    FREQUENCIES, TARGET_AUDIENCES, LANGUAGES, 
    CHURCH_SERVICES, MEMBER_RANGES, AGE_RANGES 
} from './constants';

interface GroupSettingsProps {
  leader: CellLeader;
  existingGroup?: CellGroup | null;
  initialCategory?: GroupCategory | null; 
  onSave: (group: CellGroup) => void;
  onDelete?: (groupId: string) => void;
  onCancel: () => void;
}

// Only Open and Disciple cells are formal groups requiring full settings configuration
const FORMAL_CATEGORIES: GroupCategory[] = ['open_cell', 'disciple_cell'];

const GroupSettings: React.FC<GroupSettingsProps> = ({ leader, existingGroup, initialCategory, onSave, onDelete, onCancel }) => {
  const isEditing = !!existingGroup;

  // --- Form State ---
  const [category, setCategory] = useState<GroupCategory>(existingGroup?.category || initialCategory || 'open_cell');
  const [nameSuffix, setNameSuffix] = useState<string>(existingGroup?.nameSuffix || '');
  const [frequency, setFrequency] = useState<GroupFrequency>(existingGroup?.groupFrequency || 'every_week');
  const [pastorZone, setPastorZone] = useState<ZoneCode>(existingGroup?.pastorZoneId || 'ADT');
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(existingGroup?.targetAudience || 'Mixed');
  
  const [meetingDay, setMeetingDay] = useState<DayOfWeek>(existingGroup?.groupDay || 'saturday');
  const [meetingTime, setMeetingTime] = useState<string>(existingGroup?.groupTime || '14:00');
  const [location, setLocation] = useState<string>(existingGroup?.groupLocation || '');
  
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(existingGroup?.languages || ['Cantonese']);
  const [service, setService] = useState<string>(existingGroup?.service || CHURCH_SERVICES[0]);
  const [memberRange, setMemberRange] = useState<MemberRange>(existingGroup?.regularMemberRange || '4-6');
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>(existingGroup?.ageRanges || []);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state when existingGroup or initialCategory changes
  useEffect(() => {
    if (existingGroup) {
      setCategory(existingGroup.category);
      setNameSuffix(existingGroup.nameSuffix || '');
      setFrequency(existingGroup.groupFrequency);
      setPastorZone(existingGroup.pastorZoneId);
      setTargetAudience(existingGroup.targetAudience);
      setMeetingDay(existingGroup.groupDay);
      setMeetingTime(existingGroup.groupTime);
      setLocation(existingGroup.groupLocation);
      setSelectedLanguages(existingGroup.languages);
      setService(existingGroup.service);
      setMemberRange(existingGroup.regularMemberRange);
      setSelectedAgeRanges(existingGroup.ageRanges);
    } else if (initialCategory) {
        setCategory(initialCategory);
    }
  }, [existingGroup, initialCategory]);

  // AUTO-SET FREQUENCY: Default to "every other week" for Disciple Cells
  useEffect(() => {
    if (category === 'disciple_cell') {
        setFrequency('every_other_week');
    } else if (category === 'open_cell') {
        setFrequency('every_week');
    }
  }, [category]);

  // Auto-generate name for the group
  const autoGroupName = `${leader.mgCode} - ${GROUP_CATEGORY_LABELS[category] || category}${nameSuffix ? ' - ' + nameSuffix : ''}`;

  useEffect(() => {
    if ((pastorZone as string) === 'CHI') {
      setTargetAudience(null);
    } else if (targetAudience === null && (pastorZone as string) !== 'CHI') {
      setTargetAudience('Mixed');
    }
  }, [pastorZone, targetAudience]);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleAgeRange = (range: string) => {
    setSelectedAgeRanges(prev => 
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const groupData: CellGroup = {
        id: existingGroup?.id || `new-${Date.now().toString(36)}`,
        groupName: autoGroupName,
        tribeCode: leader.tribeCode,
        category,
        nameSuffix,
        groupDay: meetingDay,
        groupTime: meetingTime,
        groupLocation: location,
        maxCapacity: existingGroup?.maxCapacity || 12,
        currentMemberCount: existingGroup?.currentMemberCount || 0,
        groupFrequency: frequency,
        pastorZoneId: pastorZone,
        targetAudience,
        languages: selectedLanguages,
        service,
        regularMemberRange: memberRange,
        ageRanges: selectedAgeRanges,
        reports: existingGroup?.reports || []
    };
    onSave(groupData);
  };

  const handleDelete = () => {
    if (existingGroup && onDelete) {
        onDelete(existingGroup.id);
        setShowDeleteConfirm(false);
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 mt-6 border-b border-slate-100 pb-2">
      {title}
    </h3>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{isEditing ? 'Cell Group Configuration' : 'Create New Cell Group'}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{GROUP_CATEGORY_LABELS[category]} Settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
                <Save className="w-4 h-4" />
                Save Changes
            </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-2 pb-24">
            
            <SectionHeader title="Basic Configuration" />
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                        <div className="relative">
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value as GroupCategory)}
                                className="w-full appearance-none p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 transition-all"
                            >
                                {FORMAL_CATEGORIES.map(key => (
                                    <option key={key} value={key}>{GROUP_CATEGORY_LABELS[key]}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Name Suffix (e.g. Youth, A)</label>
                        <input 
                            type="text" 
                            placeholder="Identify this specific group"
                            value={nameSuffix}
                            onChange={(e) => setNameSuffix(e.target.value)}
                            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Pastor Zone</label>
                        <div className="relative">
                            <select 
                                value={pastorZone} 
                                onChange={(e) => setPastorZone(e.target.value as ZoneCode)}
                                className="w-full appearance-none p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 transition-all"
                            >
                                {ZONES.map(z => <option key={z.code} value={z.code}>{z.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Frequency</label>
                        <div className="relative">
                            <select 
                                value={frequency} 
                                onChange={(e) => setFrequency(e.target.value as GroupFrequency)}
                                className="w-full appearance-none p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 transition-all"
                            >
                                {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {pastorZone !== 'CHI' && (
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Group Type</label>
                        <div className="flex flex-wrap gap-2">
                            {TARGET_AUDIENCES.map(aud => (
                                <button
                                    key={aud}
                                    type="button"
                                    onClick={() => setTargetAudience(aud as TargetAudience)}
                                    className={`
                                        px-4 py-2.5 rounded-xl text-sm font-bold border transition-all
                                        ${targetAudience === aud 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                                        }
                                    `}
                                >
                                    {aud}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <SectionHeader title="Logistics" />

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Meeting Day</label>
                         <div className="relative">
                            <select 
                                value={meetingDay} 
                                onChange={(e) => setMeetingDay(e.target.value as DayOfWeek)}
                                className="w-full appearance-none p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 transition-all"
                            >
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Meeting Time</label>
                         <input 
                            type="time" 
                            value={meetingTime} 
                            onChange={(e) => setMeetingTime(e.target.value)}
                            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 transition-all" 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                    <input 
                        type="text" 
                        placeholder="e.g. BIC Room 1, Home, Cafe"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
                    />
                </div>
            </div>

            <SectionHeader title="Demographics & Service" />

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Languages</label>
                    <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => toggleLanguage(lang)}
                                className={`
                                    px-3.5 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2
                                    ${selectedLanguages.includes(lang) 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                                    }
                                `}
                            >
                                {selectedLanguages.includes(lang) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                {lang}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Attending Service</label>
                    <div className="relative">
                        <select 
                            value={service} 
                            onChange={(e) => setService(e.target.value)}
                            className="w-full appearance-none p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 transition-all"
                        >
                            {CHURCH_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Regular Member Range</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {MEMBER_RANGES.map(range => (
                            <button
                                key={range}
                                type="button"
                                onClick={() => setMemberRange(range as MemberRange)}
                                className={`
                                    py-2.5 px-1 rounded-xl text-xs font-bold border transition-all text-center
                                    ${memberRange === range 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                    }
                                `}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Age Ranges</label>
                    <div className="flex flex-wrap gap-2">
                        {AGE_RANGES.map(age => (
                            <button
                                key={age}
                                type="button"
                                onClick={() => toggleAgeRange(age)}
                                className={`
                                    px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2
                                    ${selectedAgeRanges.includes(age) 
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                    }
                                `}
                            >
                                {selectedAgeRanges.includes(age) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                {age}
                            </button>
                        ))}
                    </div>
                 </div>
            </div>

            {/* Danger Zone */}
            {isEditing && (
                <div className="pt-10">
                    <SectionHeader title="Danger Zone" />
                    <div className="bg-red-50/50 p-8 rounded-[2rem] border border-red-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white text-red-600 rounded-2xl flex items-center justify-center shadow-sm border border-red-100 mb-4">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black text-red-900">Delete this Cell Group?</h4>
                        <p className="text-xs text-red-700/70 font-bold mt-1 mb-6 max-w-xs">
                            This will permanently remove the group and all its attendance records. This cannot be undone.
                        </p>
                        <button 
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-8 py-3 bg-red-600 text-white rounded-xl font-black text-sm shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2"
                        >
                            Delete Group Permanently
                        </button>
                    </div>
                </div>
            )}
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-2">Confirm Deletion</h4>
                <p className="text-sm text-slate-500 font-bold mb-8 leading-relaxed">
                    Are you absolutely sure? You are about to remove this group from your active list.
                </p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        type="button"
                        onClick={handleDelete}
                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-200"
                    >
                        Yes, Delete Permanently
                    </button>
                    <button 
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GroupSettings;
