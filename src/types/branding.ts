// ─── School branding ──────────────────────────────────────────────────────────

export interface SchoolBranding {
  id:                string;
  schoolId:          string;
  primaryColor:      string | null;
  accentColor:       string | null;
  logoUrl:           string | null;
  faviconUrl:        string | null;
  motto:             string | null;
  address:           string | null;
  phone:             string | null;
  email:             string | null;
  website:           string | null;
  reportCardFooter:  string | null;
  updatedAt:         string;
}

export interface SchoolBrandingWithMeta extends SchoolBranding {
  school: {
    id:   string;
    name: string;
  };
}

// ─── Update payload ────────────────────────────────────────────────────────────
// All fields optional — PATCH semantics (only send what changed).

export interface UpdateSchoolBrandingBody {
  primaryColor?:     string | null;
  accentColor?:      string | null;
  logoUrl?:          string | null;
  faviconUrl?:       string | null;
  motto?:            string | null;
  address?:          string | null;
  phone?:            string | null;
  email?:            string | null;
  website?:          string | null;
  reportCardFooter?: string | null;
}

export interface UpdateSchoolBrandingResponse {
  message:  string;
  data:     SchoolBranding;
}

// ─── Logo upload ───────────────────────────────────────────────────────────────

export interface LogoUploadUrlResponse {
  uploadUrl:  string;   // presigned PUT URL
  publicUrl:  string;   // URL to store in logoUrl after upload
  expiresIn:  number;   // seconds
}