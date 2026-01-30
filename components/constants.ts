
import { CellLeader, DayOfWeek, ZoneCode, Report, GroupCategory, GroupFrequency, TargetAudience, MemberRange, CellMember } from '../types';

export const ZONES: { code: ZoneCode; label: string }[] = [
  { code: 'ABD', label: 'Abundant (豐盛)' },
  { code: 'ADT', label: 'Adults (成人)' },
  { code: 'YOU', label: 'Youth (青年)' },
  { code: 'CHI', label: 'Children (兒童)' },
  { code: 'ANW', label: 'ANEW (列國)' },
];

export const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const ROLE_OPTIONS = ['族長', '小組長', '同工', '關懷小組長'];

export const ROLE_COLORS: Record<string, string> = {
  '族長': 'bg-orange-100 text-orange-700 border-orange-200',
  '小組長': 'bg-blue-100 text-blue-700 border-blue-200',
  '同工': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '關懷小組長': 'bg-purple-100 text-purple-700 border-purple-200',
};

export const GROUP_CATEGORY_LABELS: Record<GroupCategory, string> = {
  open_cell: 'Open Cell',
  disciple_cell: 'Disciple Cell',
  pre_cell: 'Pre Cell',
  relationship: 'Relationship(1對1門訓)',
};

export const GROUP_CATEGORY_COLORS: Record<GroupCategory, string> = {
  open_cell: 'bg-orange-100 text-orange-700 border-orange-200',
  disciple_cell: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pre_cell: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  relationship: 'bg-rose-100 text-rose-700 border-rose-200',
};

// --- Profile Constants ---
export const GENDERS = ['Male', 'Female'];
export const PROFILE_AGE_RANGES = ['12-18', '19-25', '26-35', '36-45', '46-55', '56-70', 'above 70'];
export const MARRIAGE_STATUSES = ['Single', 'Married', 'Widower', 'Divorce', 'Live alone', 'Remarried'];
export const SPECIAL_CONDITIONS = ['None', 'SEN', 'Mental disorder', 'Other'];
export const YES_NO = ['Yes', 'No'];

// --- Constants for Group Settings ---
export const EDITABLE_GROUP_CATEGORIES: GroupCategory[] = ['open_cell', 'disciple_cell', 'pre_cell', 'relationship'];
export const FREQUENCIES: GroupFrequency[] = ['every_week', 'every_other_week'];
export const TARGET_AUDIENCES: TargetAudience[] = ['Brothers', 'Sisters', 'Couples', 'Mixed', 'Teens', 'Youth', 'Young Adults'];
export const LANGUAGES = ['Cantonese', 'Mandarin', 'English'];
export const CHURCH_SERVICES = ['Sunday Service', 'Abundant 120', 'Saturday Service', 'Youth Service'];
export const MEMBER_RANGES: MemberRange[] = ['1-3', '4-6', '7-9', '10-12', 'Above 12'];
export const AGE_RANGES = ['Below 18', '18-25', '26-35', '36-45', '46-55', '56-65', 'Above 65'];

// --- Mock Data Helpers ---
const generateReports = (count: number, category: GroupCategory, baseCount: number): Report[] => {
  const reports: Report[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const reportDate = new Date();
    reportDate.setDate(today.getDate() - (i * 7));
    const attendance = Math.max(1, Math.floor(baseCount * (0.8 + Math.random() * 0.3)));
    reports.push({
      id: `rep-${Math.random().toString(36).substr(2, 9)}`,
      gatheringDate: reportDate.toISOString().split('T')[0],
      gatheringTime: '19:30',
      attendanceCount: attendance,
      newVisitorCount: Math.floor(Math.random() * 2),
      category: category,
      notes: i % 3 === 0 ? 'Powerful testimony shared today.' : '-'
    });
  }
  return reports;
};

export const MOCK_MEMBERS: CellMember[] = [
  { id: 'm1', chineseName: '陳大文', englishName: 'David Chan', phoneNumber: '98765432', birthday: '1990-05-15', memberId: 'M1001', status: 'active', groupIds: ['g19_1'], joinedDate: '2023-01-10' },
  { id: 'm2', chineseName: '李美美', englishName: 'May Lee', phoneNumber: '91234567', birthday: '1992-11-20', memberId: 'M1002', status: 'active', groupIds: ['g19_1', 'g20_1'], joinedDate: '2023-02-15' },
  { id: 'm3', chineseName: '張志強', englishName: 'John Cheung', phoneNumber: '92345678', birthday: '1985-03-05', status: 'active', groupIds: ['g19_1'], joinedDate: '2023-01-20' },
  { id: 'm4', chineseName: '王小芬', englishName: 'Fanny Wong', phoneNumber: '93456789', birthday: '1988-08-25', memberId: 'M1004', status: 'active', groupIds: ['g21_1'], joinedDate: '2023-04-12' },
  { id: 'm5', chineseName: '劉一峰', englishName: 'Kevin Lau', phoneNumber: '94567890', birthday: '1995-12-30', status: 'active', groupIds: ['g21_1'], joinedDate: '2023-05-18' },
];

export const MOCK_LEADERS: CellLeader[] = [
  {
    id: 'l1',
    personId: 'p1',
    mgCode: 'G',
    tribeCode: 'G',
    generation: 1,
    chineseName: '張O年',
    firstName: '牧師',
    lastName: '',
    email: 'sp@church611.org',
    phoneNumber: '+85261000100',
    password: '611611',
    avatarUrl: '',
    gender: 'Male',
    roles: ['小組長', '同工', '族長'],
    isAdmin: true,
    status: 'active',
    groups: [
    ]
  },
  // ... (keeping existing leaders)
  {
    id: 'l19',
    personId: 'p19',
    mgCode: 'GJ',
    tribeCode: 'GJ',
    generation: 1,
    chineseName: '王O勝',
    firstName: 'Jason',
    lastName: '',
    email: 'jasonwang@church611.org',
    phoneNumber: '+85261000111',
    password: '611611',
    avatarUrl: '',
    gender: 'Male',
    roles: ['同工', '族長', '小組長'],
    isAdmin: true,
    status: 'active',
    parentLeaderName: 'G-張恩年',
    groups: [
      {
        id: 'g19_1',
        groupName: 'GJ-D-A-Mixed',
        tribeCode: 'GJ',
        category: 'disciple_cell',
        groupDay: 'thursday',
        groupTime: '19:30',
        groupLocation: 'BIC',
        maxCapacity: 12,
        currentMemberCount: 8,
        groupFrequency: 'every_week',
        pastorZoneId: 'ADT',
        targetAudience: 'Mixed',
        languages: ['Mandarin'],
        service: 'Sunday Service',
        regularMemberRange: '7-9',
        ageRanges: ['36-45'],
        reports: generateReports(5, 'disciple_cell', 8)
      }
    ]
  },
  // ... (keeping other leaders)
  {
    id: 'l111',
    personId: 'p111',
    mgCode: 'MY',
    tribeCode: 'MY',
    generation: 1,
    chineseName: '陳O怡',
    firstName: 'Anne',
    lastName: '',
    email: 'anne.chan117@gmail.com',
    phoneNumber: '+85261001018',
    password: '611611',
    avatarUrl: '',
    gender: 'Female',
    roles: ['同工', '族長', '小組長'],
    isAdmin: false,
    status: 'active',
    parentLeaderName: 'G-張陳培南',
    groups: [
    ]
  }
];
