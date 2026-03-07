import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

interface IUser {
  email: string;
  password: string;
  settings?: {
    theme: string;
    encryptedKeys?: {
      claude?: string;
      openai?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    settings: {
      theme: { type: String, default: 'dark' },
      encryptedKeys: {
        claude: String,
        openai: String,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
