const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: { type: String, default: 'explorer' },
    avatarUrl: String,
    timeline: [
      {
        type: { type: String }, // 'project', 'note', etc.
        content: String,
        date: Date
      }
    ],
    privateData: {
      messages: [String],
      notes: [String]
    }
  });