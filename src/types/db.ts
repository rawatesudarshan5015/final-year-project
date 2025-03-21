export interface Message {
  id: number;
  _id?: string | any; // MongoDB ObjectId
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: Date;
  sender_name?: string;
  read_by?: number[]; // Array of user IDs who have read the message
}

export interface Conversation {
  id: number;
  created_at: Date;
  participant_names: string;
  participant_ids: string;
}

export interface Profile {
  id: number;
  name: string;
  email: string;
  ern_number: string;
  mobile_number: string;
  branch: string;
  batch_year: number;
  section: string;
  profile_pic_url?: string;
  cloudinary_public_id?: string;
  interests?: {
    [key: string]: string[];
  };
}

export interface Interest {
  _id?: string;
  category: string;
  options: string[];
} 