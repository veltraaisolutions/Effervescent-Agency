export interface Candidate {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  instagram: string | null;
  dob: string | null;
  gender: string | null;
  primary_location: string;
  second_location: string | null;
  manual_location: string | null;
  is_student: boolean;
  home_city: string | null;
  does_drive: boolean;
  role_interest: string | null;
  photo_urls: string[];
  passport_url: string | null;
  has_non_uk_passport: boolean;
  share_code: string | null;
  has_prior_experience: boolean;
  previous_company: string | null;
  years_experience: number | null;
  understand_role: string | null;
  why_good_fit: string | null;
  sales_experience: string | null;
  available_from: string | null;
  self_employed: boolean;
  weekend_work: boolean;
  heard_about: string | null;
  status:
    | "pending"
    | "approved"
    | "interview booked"
    | "rejected"
    | "rejected - non responsive"
    | "trial_offered"
    | "onboarding"
    | "on-boarded";
  rejection_reason: string | null;
  passport_valid: boolean | null;
  is_uk_passport: boolean | null;
  wa_sent_at: string | null;
  trial_offered_at: string | null;
  onboarded_at: string | null;
  trial_success: boolean | null;
  ai_verification: "Passed" | "Failed" | null;
  trial_venue: string | null;
  trial_mentor: string | null;
  rotacloud_login: boolean;
  sumup_account: boolean;
  contract_signed: boolean;
  added_to_whatsapp_group: boolean;
  staff_notes: string | null;
}
