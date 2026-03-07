export interface Section {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  route: string;
}

export interface User {
  id: string;
  email: string;
  settings?: {
    theme: string;
    encryptedKeys?: {
      claude?: string;
      openai?: string;
    };
  };
}
