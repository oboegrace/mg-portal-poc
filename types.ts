
export type ZoneCode = 'ABD' | 'ADT' | 'YOU' | 'CHI' | 'ANW';
export type GroupCategory = 'open_cell' | 'disciple_cell' | 'pre_cell' | 'relationship';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type GroupFrequency = 'every_week' | 'every_other_week';
export type TargetAudience = 'Brothers' | 'Sisters' | 'Couples' | 'Mixed' | 'Teens' | 'Youth' | 'Young Adults';
export type MemberRange = '1-3' | '4-6' | '7-9' | '10-12' | 'Above 12';
export type AccountStatus = 'active' | 'disabled';

export interface FollowUpRecord {
  id: string;
  adminName: string;
  adminId: string;
  date: string;
  content: string;
}

export interface TransferRecord {
  id: string;
  transferType: 'transfer';
  fromParentId?: string;
  fromParentName?: string;
  toParentId?: string;
  toParentName?: string;
  changeDate: string;
  changedBy: string;
  changedById: string;
  reason?: string;
}

export interface StatusChangeRecord {
  id: string;
  oldStatus: AccountStatus;
  newStatus: AccountStatus;
  changeDate: string;
  changedBy: string;
  changedById: string;
  reason?: string;
}

export interface GuestRecord {
  id: string;
  name: string;
  phone?: string;
}

export interface Report {
  id: string;
  gatheringDate: string; // YYYY-MM-DD
  gatheringTime?: string; // HH:MM
  attendanceCount: number;
  newVisitorCount: number;
  category: GroupCategory;
  notes: string;
  isDeleted?: boolean;
  attendedMemberIds?: string[];
  guests?: GuestRecord[];
}

export interface CellGroup {
  id: string;
  groupName: string;
  groupCode?: string;
  tribeCode: string;
  category: GroupCategory;
  groupDay: DayOfWeek;
  groupTime: string;
  groupLocation: string;
  groupAddress?: string;
  maxCapacity: number;
  currentMemberCount: number;
  groupFrequency: GroupFrequency;
  pastorZoneId: ZoneCode;
  targetAudience: TargetAudience | null;
  languages: string[];
  service: string;
  regularMemberRange: MemberRange;
  ageRanges: string[];
  reports: Report[];
  nameSuffix?: string;
  isDeleted?: boolean;
}

export interface CellMember {
  id: string;
  chineseName: string;
  englishName?: string;
  phoneNumber: string;
  birthday?: string;
  memberId?: string;
  status: 'active' | 'inactive';
  groupIds: string[]; // Which groups this member belongs to
  joinedDate: string;
  avatarUrl?: string;
}

export interface CellLeader {
  id: string;
  personId: string;
  mgCode: string;
  tribeCode: string;
  generation: number;
  
  // System Role & Account Status
  isAdmin?: boolean;
  status: AccountStatus;
  lastLogin?: string;
  
  // Person Data
  chineseName?: string;
  lastName?: string;
  firstName?: string;
  preferredName?: string;
  nickName?: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string;
  gender?: 'Male' | 'Female';
  ageRange?: string;
  occupation?: string;
  marriageStatus?: string;
  memberId?: string;
  
  // New Many-to-Many Roles
  roles: string[]; 
  
  parentLeaderId?: string; // Added for hierarchy
  parentLeaderName?: string;
  ordinationDate?: string;
  identity?: string;
  
  // Ministry Options
  recommendTeamMembers?: 'Yes' | 'No';
  pastorEmotionalIssues?: 'Yes' | 'No';
  specialConditionMember?: 'None' | 'SEN' | 'Mental disorder' | 'Other';
  
  password?: string;
  groups: CellGroup[];
  followUpRecords?: FollowUpRecord[];
  transferHistory?: TransferRecord[];
  statusHistory?: StatusChangeRecord[];
}

export interface FilterState {
  generations: number[];
  zones: ZoneCode[];
  days: DayOfWeek[];
}
