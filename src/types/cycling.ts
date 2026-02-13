export interface CyclingResultAction {
  type: string
  url: string
  text: string
  icon: string
  style: string | null
  disabled: boolean
  confirmation_message: string | null
  default_table_row_action: boolean
}

export interface CyclingResult {
  id: number
  event_id: number
  race_id: number
  race_date: string
  race_date_split: {
    type: string
    month: string
    day: string
    year: string
    to_date: string | null
  }
  race_age: { type: string }
  event_name: string
  discipline_slug: string
  place: string
  total_riders: number
  points: string
  time: { type: string }
  bib: string
  team: string
  action: CyclingResultAction[]
}

export interface CyclingResultsPageResponse {
  total: number
  page: number
  data: CyclingResult[]
  items_per_page: number
  statistics: unknown
}
