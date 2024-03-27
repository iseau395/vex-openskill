// Generic

export interface PageMeta {
    current_page: number,
    first_page_url: string,
    from: number,
    to: number,
    last_page: number,
    last_page_url: string,
    next_page_url: string,
    path: string,
    per_page: number,
    prev_page_url: string,
    total: number,
}

export interface Paginated<T> {
    meta: PageMeta,
    data: T[];
}

export interface IdInfo {
    id: number,
    name: string,
    code: string | null,
}


// Specific Types

export interface Event {
    id: number,
    sku: string,
    name: string,
    start?: string,
    end?: string,
    season: IdInfo,
    program: IdInfo,
    location: Location,
    locations?: { [key: string]: Location },
    divisions?: Division[],
    level?: EventLevel,
    ongoing?: boolean,
    awards_finalized: boolean,
    event_type: EventType
}

export enum EventType {
    Tournament = "tournament",
    Leauge = "leauge",
    Workshop = "workshop",
    Virtual = "virtual",
}

export interface Program {
    id: number,
    abbr: string,
    name: string
}

export enum EventLevel {
    World = "World",
    National = "National",
    Regional = "Regional",
    Signature = "Signature",
    State = "State",
    Other = "Other"
}

export interface Location {
    venue?: string,
    address_1?: string,
    address_2?: string,
    city?: string,
    region?: string,
    postcode?: string,
    country?: string,
    coordinates?: {
        lat?: number,
        long?: number
    }
}

export interface Division {
    id?: number,
    name?: string,
    order?: number
}

export enum Grade {
    College = "College",
    HighSchool = "High School",
    MiddleSchool = "Middle School",
    ElementarySchool = "Elementary School", 
}

export interface Team {
    id: number,
    number: string,
    team_name?: string,
    robot_name?: string,
    organization?: string,
    location?: Location,
    registered?: boolean,
    program: IdInfo,
    grade?: Grade
}

export interface Match {
    id: number,
    event: IdInfo,
    division: IdInfo,
    round: number,
    instance: number,
    matchnum: number,
    scheduled?: string,
    started?: string,
    field: string,
    scored: boolean,
    name: string,
    alliances: Alliance[],
}

export enum AllianceColor {
    Red = "red",
    Blue = "blue",
}

export interface Alliance {
    color: AllianceColor,
    score: number,
    teams: AllianceTeam[],
}

export interface AllianceTeam {
    team?: IdInfo,
    sitting?: boolean
}

export interface Ranking {
    id?: number,
    event?: IdInfo,
    division?: IdInfo,
    rank?: number,
    team?: IdInfo,
    wins?: number,
    losses?: number,
    ties?: number,
    wp?: number,
    ap?: number,
    sp?: number,
    high_score?: number,
    average_points?: number,
    total_points?: number,
}

export interface Skill {
    id?: number,
    event?: IdInfo,
    team?: IdInfo,
    type?: SkillType,
    season?: IdInfo,
    division?: IdInfo,
    rank?: number,
    score?: number,
    attempts?: number
}

export enum SkillType {
    Driver = "driver",
    Programming = "programming",
    PackageDeliveryTime = "package_delivery_time",
}

export interface Award {
    id?: number,
    event?: IdInfo,
    order?: number,
    title?: string,
    qualifications?: string[],
    designation?: AwardDesignation,
    classification?: AwardClassification,
    teamWinners?: TeamAwardWinner[],
    individualWinners?: string[];
}

export enum AwardDesignation {
    Tournament = "tournament",
    Division = "division",
}

export enum AwardClassification {
    Champion = "champion",
    Finalist = "finalist",
    Semifinalist = "semifinalist",
    Quarterfinalist = "quarterfinalist",
}

export interface TeamAwardWinner {
    division: IdInfo,
    team: IdInfo,
}

export interface Season {
    id?: number,
    name?: string,
    program?: IdInfo,
    start?: string,
    end?: string,
    years_start?: number,
    years_end?: number,
}

export interface RobotEventsError {
    code: number,
    message: string,
}