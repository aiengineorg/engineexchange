export interface Profile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  similarity?: number;
  matchReason?: string;
  searchedField?: "what_i_offer" | "what_im_looking_for";
  images?: string[];
  discordId?: string | null;
  currentRole?: string;
  currentCompany?: string;
  university?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
}
